/**
 *  Copyright (c) 2015-present, The Regents of the University of California,
 *  through Lawrence Berkeley National Laboratory (subject to receipt
 *  of any required approvals from the U.S. Dept. of Energy).
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree.
 */

import * as React from "react";
import { format } from "d3-format";

import { ValueList } from "./ValueList";
import { InfoBoxStyle } from "./style";

export type LabelAxisProps = {
    /**
     * The label to show as the axis.
     */
    label: string;

    /**
     * Show or hide the max/min values that appear alongside the label
     */
    hideScale?: boolean;

    /**
     * Supply a list of label value pairs to render within the LabelAxis.
     * This expects an array of objects. Each object is of the form:
     *     {label: "Speed", value: "26.2 mph"}.
     */
    values: {
        label?: string;
        value?: number | string;
    }[];

    /**
     * Width to provide the values
     */
    valWidth?: number;

    /**
     * Max value of the axis scale
     */
    max: number;

    /**
     * Min value of the axis scale
     */
    min: number;

    /**
     * If values are numbers, use this format string
     */
    format?: string;

    /**
     * The width of the axis
     */
    width?: number;

    /**
     * The height of the axis
     */
    height?: number;
};

/**
 * Renders a 'axis' that display a label for a data channel and a
 * max and average value:
 * ```
 *      +----------------+-----+------- ...
 *      | Traffic        | 120 |
 *      | Max 100 Gbps   |     | Chart  ...
 *      | Avg 26 Gbps    | 0   |
 *      +----------------+-----+------- ...
 * ```
 * 
 * This can be used for data channel style displays where the user will see many
 * rows of data stacked on top of each other and will need to interact with the
 * data to see actual values. You can combine this with the `ValueAxis` to help
 * do that. See the Cycling example for exactly how to arrange that.
 * 
 */
export class LabelAxis extends React.Component<LabelAxisProps> {
    static defaultProps: Partial<LabelAxisProps> = {
        hideScale: false,
        values: [],
        valWidth: 40,
        format: ".2f"
    };

    renderAxis() {
        const valueWidth = this.props.valWidth;
        const rectWidth = this.props.width - valueWidth;

        const style: React.CSSProperties = {
            fontSize: 11,
            textAnchor: "start",
            fill: "#bdbdbd"
        };

        if (this.props.hideScale) {
            return <g />;
        }
        const valXPos = rectWidth + 3; // padding
        const fmt = this.props.format;
        const maxStr = format(fmt)(this.props.max);
        const minStr = format(fmt)(this.props.min);

        return (
            <g>
                <text x={valXPos} y={0} dy="1.2em" style={style}>
                    {maxStr}
                </text>
                <text x={valXPos} y={this.props.height} style={style}>
                    {minStr}
                </text>
            </g>
        );
    }

    render() {
        const textStyle: React.CSSProperties = {
            fontSize: 12,
            textAnchor: "middle",
            fill: "#838383"
        };

        const valueWidth = this.props.valWidth;
        const rectWidth = this.props.width - valueWidth;
        
        let valueList = null;
        let labelYPos: number;
        if (this.props.values) {
            labelYPos = Math.max(Math.round(this.props.height / 4), 10);
            const style: InfoBoxStyle = {
                text: textStyle,
                box: {
                    fill: "none",
                    stroke: "none"
                }
            };
            valueList = <ValueList style={style} values={this.props.values} width={rectWidth} />;
        } else {
            labelYPos = Math.round(this.props.height / 2);
        }

        return (
            <g>
                <rect
                    x="0"
                    y="0"
                    width={rectWidth}
                    height={this.props.height}
                    style={{ fill: "none", stroke: "none" }}
                />
                <text x={Math.round(rectWidth / 2)} y={labelYPos} style={textStyle}>
                    {this.props.label}
                </text>
                <g transform={`translate(0,${labelYPos + 2})`}>{valueList}</g>
                {this.renderAxis()}
            </g>
        );
    }
}
