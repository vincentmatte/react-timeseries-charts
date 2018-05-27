"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var _ = require("lodash");
var React = require("react");
var d3_shape_1 = require("d3-shape");
var pondjs_1 = require("pondjs");
var curve_1 = require("./curve");
var styler_1 = require("./styler");
var style_1 = require("./style");
var types_1 = require("./types");
var util_1 = require("./util");
var LineChart = (function (_super) {
    tslib_1.__extends(LineChart, _super);
    function LineChart() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    LineChart.prototype.shouldComponentUpdate = function (nextProps) {
        var newSeries = nextProps.series;
        var oldSeries = this.props.series;
        var width = nextProps.width;
        var timeScale = nextProps.timeScale;
        var yScale = nextProps.yScale;
        var interpolation = nextProps.interpolation;
        var highlight = nextProps.highlight;
        var selection = nextProps.selection;
        var columns = nextProps.columns;
        var widthChanged = this.props.width !== width;
        var timeScaleChanged = util_1.scaleAsString(this.props.timeScale) !== util_1.scaleAsString(timeScale);
        var yAxisScaleChanged = this.props.yScale !== yScale;
        var interpolationChanged = this.props.interpolation !== interpolation;
        var highlightChanged = this.props.highlight !== highlight;
        var selectionChanged = this.props.selection !== selection;
        var columnsChanged = this.props.columns !== columns;
        var seriesChanged = false;
        if (oldSeries.size() !== newSeries.size()) {
            seriesChanged = true;
        }
        else {
            seriesChanged = !pondjs_1.TimeSeries.is(oldSeries, newSeries);
        }
        return (widthChanged ||
            seriesChanged ||
            timeScaleChanged ||
            yAxisScaleChanged ||
            interpolationChanged ||
            highlightChanged ||
            selectionChanged ||
            columnsChanged);
    };
    LineChart.prototype.handleHover = function (e, column) {
        if (this.props.onHighlightChange) {
            this.props.onHighlightChange(column);
        }
    };
    LineChart.prototype.handleHoverLeave = function () {
        if (this.props.onHighlightChange) {
            this.props.onHighlightChange(null);
        }
    };
    LineChart.prototype.handleClick = function (e, column) {
        e.stopPropagation();
        if (this.props.onSelectionChange) {
            this.props.onSelectionChange(column);
        }
    };
    LineChart.prototype.providedPathStyleMap = function (column) {
        if (this.props.style) {
            if (this.props.style instanceof styler_1.Styler) {
                return this.props.style.lineChartStyle()[column];
            }
            else if (_.isObject(this.props.style)) {
                var s = this.props.style;
                return s[column];
            }
            else {
                var fn = this.props.style;
                return fn(column);
            }
        }
    };
    LineChart.prototype.pathStyle = function (element, column) {
        var style;
        var isHighlighted = this.props.highlight && column === this.props.highlight;
        var isSelected = this.props.selection && column === this.props.selection;
        var styleMap = this.providedPathStyleMap(column);
        var d = style_1.defaultLineChartChannelStyle.line;
        var s = styleMap[element] ? styleMap[element] : styleMap;
        if (this.props.selection) {
            if (isSelected) {
                style = _.merge(true, d.selected, s.selected ? s.selected : {});
            }
            else if (isHighlighted) {
                style = _.merge(true, d.highlighted, s.highlighted ? s.highlighted : {});
            }
            else {
                style = _.merge(true, d.muted, s.muted ? s.muted : {});
            }
        }
        else if (isHighlighted) {
            style = _.merge(true, d.highlighted, s.highlighted ? s.highlighted : {});
        }
        else {
            style = _.merge(true, d.normal, s.normal ? s.normal : {});
        }
        style.pointerEvents = "none";
        return style;
    };
    LineChart.prototype.renderPath = function (data, column, key) {
        var _this = this;
        var hitStyle = {
            stroke: "white",
            fill: "none",
            opacity: 0.0,
            strokeWidth: 7,
            cursor: "crosshair",
            pointerEvents: "stroke"
        };
        var path = d3_shape_1.line()
            .curve(curve_1.default[this.props.interpolation])
            .x(function (d) { return _this.props.timeScale(d.x); })
            .y(function (d) { return _this.props.yScale(d.y); })(data);
        return (React.createElement("g", { key: key },
            React.createElement("path", { d: path, style: this.pathStyle("line", column) }),
            React.createElement("path", { d: path, style: hitStyle, onClick: function (e) { return _this.handleClick(e, column); }, onMouseLeave: function () { return _this.handleHoverLeave(); }, onMouseMove: function (e) { return _this.handleHover(e, column); } })));
    };
    LineChart.prototype.renderLines = function () {
        var _this = this;
        return _.map(this.props.columns, function (column) { return _this.renderLine(column); });
    };
    LineChart.prototype.renderLine = function (column) {
        var _this = this;
        var pathLines = [];
        var count = 1;
        if (this.props.breakLine) {
            var currentPoints_1 = null;
            this.props.series
                .collection()
                .eventList()
                .forEach(function (d) {
                var timestamp = new Date(d.begin().getTime() + (d.end().getTime() - d.begin().getTime()) / 2);
                var value = d.get(column);
                var badPoint = _.isNull(value) || _.isNaN(value) || !_.isFinite(value);
                if (!badPoint) {
                    if (!currentPoints_1)
                        currentPoints_1 = [];
                    currentPoints_1.push({ x: timestamp, y: value });
                }
                else if (currentPoints_1) {
                    if (currentPoints_1.length > 1) {
                        pathLines.push(_this.renderPath(currentPoints_1, column, count));
                        count += 1;
                    }
                    currentPoints_1 = null;
                }
            });
            if (currentPoints_1 && currentPoints_1.length > 1) {
                pathLines.push(this.renderPath(currentPoints_1, column, count));
                count += 1;
            }
        }
        else {
            var cleanedPoints_1 = [];
            this.props.series
                .collection()
                .eventList()
                .forEach(function (d) {
                var timestamp = new Date(d.begin().getTime() + (d.end().getTime() - d.begin().getTime()) / 2);
                var value = d.get(column);
                var badPoint = _.isNull(value) || _.isNaN(value) || !_.isFinite(value);
                if (!badPoint) {
                    cleanedPoints_1.push({ x: timestamp, y: value });
                }
            });
            pathLines.push(this.renderPath(cleanedPoints_1, column, count));
            count += 1;
        }
        return React.createElement("g", { key: column }, pathLines);
    };
    LineChart.prototype.render = function () {
        return React.createElement("g", null, this.renderLines());
    };
    LineChart.defaultProps = {
        columns: ["value"],
        interpolation: types_1.CurveInterpolation.curveLinear,
        breakLine: true,
        visible: true
    };
    return LineChart;
}(React.Component));
exports.LineChart = LineChart;
//# sourceMappingURL=LineChart.js.map