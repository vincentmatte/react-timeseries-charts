/**
 *  Copyright (c) 2015-present, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */
import * as _ from "lodash";
import * as React from "react";
import { line } from "d3-shape";

import { TimeSeries, Key } from "pondjs";

import { ChartProps } from "./Charts";
import curves from "./curve";
import { Styler } from "./styler";

import {
    LineChartChannelStyle,
    LineChartStyle,
    ElementStyle,
    defaultLineChartChannelStyle as defaultStyle
} from "./style";

import { CurveInterpolation, LineData } from "./types";
import { scaleAsString } from "./util";

export type LineChartProps = ChartProps & {
    /**
     * What [Pond TimeSeries](https://esnet-pondjs.appspot.com/#/timeseries) data to visualize
     */
    series: TimeSeries<Key>;

    /**
     * Reference to the axis which provides the vertical scale for drawing.
     * e.g. specifying `axis="trafficRate"` would refer the y-scale of the YAxis
     * with id="trafficRate".
     */
    axis: string;

    /**
     * Which columns from the series to draw.
     */
    columns?: string[];

    /**
     * The styles to apply to the underlying SVG lines. This is a mapping
     * of column names to objects with style attributes, in the following
     * format:
     *
     * ```
     * const style = {
     *     in: {
     *         normal: {stroke: "steelblue", fill: "none", strokeWidth: 1},
     *         highlighted: {stroke: "#5a98cb", fill: "none", strokeWidth: 1},
     *         selected: {stroke: "steelblue", fill: "none", strokeWidth: 1},
     *         muted: {stroke: "steelblue", fill: "none", opacity: 0.4, strokeWidth: 1}
     *     },
     *     out: {
     *         ...
     *     }
     * };
     *
     *  <LineChart style={style} ... />
     * ```
     *
     * Alternatively, you can pass in a `Styler`. For example:
     *
     * ```
     * const currencyStyle = Styler([
     *     {key: "aud", color: "steelblue", width: 1, dashed: true},
     *     {key: "euro", color: "#F68B24", width: 2}
     * ]);
     *
     * <LineChart columns={["aud", "euro"]} style={currencyStyle} ... />
     *
     * ```
     */
    style?: LineChartStyle | ((column: string) => LineChartChannelStyle) | Styler;

    /**
     * Any of D3's interpolation modes.
     */
    interpolation?: CurveInterpolation;

    /**
     * The determines how to handle bad/missing values in the supplied
     * TimeSeries. A missing value can be null or NaN. If breakLine
     * is set to true then the line will be broken on either side of
     * the bad value(s). If breakLine is false (the default) bad values
     * are simply removed and the adjoining points are connected.
     */
    breakLine?: boolean;

    /**
     * The selected item, which will be rendered in the "selected" style.
     * If a line is selected, all other lines will be rendered in the "muted" style.
     *
     * See also `onSelectionChange`
     */
    selection?: string;

    /**
     * A callback that will be called when the selection changes. It will be called
     * with the column corresponding to the line being clicked.
     */
    onSelectionChange?: (...args: any[]) => any;

    /**
     * The highlighted column, which will be rendered in the "highlighted" style.
     *
     * See also `onHighlightChange`
     */
    highlight?: string;

    /**
     * A callback that will be called when the hovered over line changes.
     * It will be called with the corresponding column.
     */
    onHighlightChange?: (...args: any[]) => any;

    /**
     * Show or hide this chart
     */
    visible?: boolean;
};

/**
 * @private
 */
export type Point = {
    x: Date;
    y: number;
};

/**
 * @private
 */
export type PointData = Point[];

/**
 * The `<LineChart>` component is able to display multiple columns of a TimeSeries
 * as separate line charts.
 *
 * The `<LineChart>` should be used within `<ChartContainer>` etc., as this will
 * construct the horizontal and vertical axis, and manage other elements.
 *
 * Here is an example of two columns of a TimeSeries being plotted with the `<LineChart>`:
 *
 * ```
  <ChartContainer timeRange={this.state.timerange} >
    <ChartRow height="200">
      <YAxis id="y" label="Price ($)" min={0.5} max={1.5} format="$,.2f" />
      <Charts>
        <LineChart
          axis="y"
          breakLine={false}
          series={currencySeries}
          columns={["aud", "euro"]}
          style={style}
          interpolation="curveBasis" />
      </Charts>
    </ChartRow>
  </ChartContainer>
 * ```
 */
export class LineChart extends React.Component<LineChartProps, {}> {
    static defaultProps: Partial<LineChartProps> = {
        columns: ["value"],
        interpolation: CurveInterpolation.curveLinear,
        breakLine: true,
        visible: true
    };

    shouldComponentUpdate(nextProps: LineChartProps) {
        const newSeries = nextProps.series;
        const oldSeries = this.props.series;
        const width = nextProps.width;
        const timeScale = nextProps.timeScale;
        const yScale = nextProps.yScale;
        const interpolation = nextProps.interpolation;
        const highlight = nextProps.highlight;
        const selection = nextProps.selection;
        const columns = nextProps.columns;

        // What changed?
        const widthChanged = this.props.width !== width;
        const timeScaleChanged = scaleAsString(this.props.timeScale) !== scaleAsString(timeScale);
        const yAxisScaleChanged = this.props.yScale !== yScale;
        const interpolationChanged = this.props.interpolation !== interpolation;
        const highlightChanged = this.props.highlight !== highlight;
        const selectionChanged = this.props.selection !== selection;
        const columnsChanged = this.props.columns !== columns;

        let seriesChanged = false;
        if (oldSeries.size() !== newSeries.size()) {
            seriesChanged = true;
        } else {
            seriesChanged = !TimeSeries.is(oldSeries, newSeries);
        }

        return (
            widthChanged ||
            seriesChanged ||
            timeScaleChanged ||
            yAxisScaleChanged ||
            interpolationChanged ||
            highlightChanged ||
            selectionChanged ||
            columnsChanged
        );
    }

    handleHover(e: React.MouseEvent<SVGPathElement>, column: string) {
        if (this.props.onHighlightChange) {
            this.props.onHighlightChange(column);
        }
    }

    handleHoverLeave() {
        if (this.props.onHighlightChange) {
            this.props.onHighlightChange(null);
        }
    }

    handleClick(e: React.MouseEvent<SVGPathElement>, column: string) {
        e.stopPropagation();
        if (this.props.onSelectionChange) {
            this.props.onSelectionChange(column);
        }
    }

    /**
     * Fetch the supplied style as a LineChartStyle, given a provided
     * LineChartStyle, Styler, or function, for the `column` provided.
     */
    providedPathStyleMap(column: string): LineChartChannelStyle {
        if (this.props.style) {
            if (this.props.style instanceof Styler) {
                return this.props.style.lineChartStyle()[column];
            } else if (_.isObject(this.props.style)) {
                const s = this.props.style as LineChartStyle;
                return s[column];
            } else {
                const fn = this.props.style as (c: string) => LineChartChannelStyle;
                return fn(column);
            }
        }
    }

    /**
     * Returns the style used for drawing the path
     */
    pathStyle(element: string, column: string) {
        let style: React.CSSProperties;

        const isHighlighted = this.props.highlight && column === this.props.highlight;
        const isSelected = this.props.selection && column === this.props.selection;
        const styleMap = this.providedPathStyleMap(column);
        const d = defaultStyle.line;
        const s = styleMap[element] ? styleMap[element] : styleMap;

        if (this.props.selection) {
            if (isSelected) {
                style = _.merge(true, d.selected, s.selected ? s.selected : {});
            } else if (isHighlighted) {
                style = _.merge(true, d.highlighted, s.highlighted ? s.highlighted : {});
            } else {
                style = _.merge(true, d.muted, s.muted ? s.muted : {});
            }
        } else if (isHighlighted) {
            style = _.merge(true, d.highlighted, s.highlighted ? s.highlighted : {});
        } else {
            style = _.merge(true, d.normal, s.normal ? s.normal : {});
        }

        style.pointerEvents = "none";
        return style;
    }

    renderPath(data: PointData, column: string, key: number) {
        const hitStyle: React.CSSProperties = {
            stroke: "white",
            fill: "none",
            opacity: 0.0,
            strokeWidth: 7,
            cursor: "crosshair",
            pointerEvents: "stroke"
        };

        // D3 generates each path
        const path = line<LineData>()
            .curve(curves[this.props.interpolation])
            .x(d => this.props.timeScale(d.x))
            .y(d => this.props.yScale(d.y))(data);

        return (
            <g key={key}>
                <path d={path} style={this.pathStyle("line", column)} />
                <path
                    d={path}
                    style={hitStyle}
                    onClick={e => this.handleClick(e, column)}
                    onMouseLeave={() => this.handleHoverLeave()}
                    onMouseMove={e => this.handleHover(e, column)}
                />
            </g>
        );
    }

    renderLines() {
        return _.map(this.props.columns, column => this.renderLine(column));
    }

    renderLine(column: string) {
        const pathLines = [];
        let count = 1;
        if (this.props.breakLine) {
            // Remove nulls and NaNs from the line by generating a break in the line
            let currentPoints: PointData = null;
            this.props.series
                .collection()
                .eventList()
                .forEach(d => {
                const timestamp = new Date(
                    d.begin().getTime() + (d.end().getTime() - d.begin().getTime()) / 2
                );
                const value = d.get(column);
                const badPoint = _.isNull(value) || _.isNaN(value) || !_.isFinite(value);
                if (!badPoint) {
                    if (!currentPoints) currentPoints = [];
                    currentPoints.push({ x: timestamp, y: value });
                } else if (currentPoints) {
                    if (currentPoints.length > 1) {
                        pathLines.push(this.renderPath(currentPoints, column, count));
                        count += 1;
                    }
                    currentPoints = null;
                }
            });
            if (currentPoints && currentPoints.length > 1) {
                pathLines.push(this.renderPath(currentPoints, column, count));
                count += 1;
            }
        } else {
            // Ignore nulls and NaNs in the line
            const cleanedPoints: PointData = [];
            this.props.series
                .collection()
                .eventList()
                .forEach(d => {
                    const timestamp = new Date(
                        d.begin().getTime() + (d.end().getTime() - d.begin().getTime()) / 2
                    );
                    const value = d.get(column);
                    const badPoint = _.isNull(value) || _.isNaN(value) || !_.isFinite(value);
                    if (!badPoint) {
                        cleanedPoints.push({ x: timestamp, y: value });
                    }
                });
            pathLines.push(this.renderPath(cleanedPoints, column, count));
            count += 1;
        }
        return <g key={column}>{pathLines}</g>;
    }

    render() {
        return <g>{this.renderLines()}</g>;
    }
}
