import React, { Component, PureComponent } from 'react';
import ReactDOM from 'react-dom';
import { IndexLink } from 'react-router';
import DatePicker from 'react-datepicker';
import moment from 'moment';
import classnames from 'classnames';
import 'react-datepicker/dist/react-datepicker.css';
import '../assets/stylesheets/components/Explorer.scss';
import AmCharts from '@amcharts/amcharts3-react';
import { connect } from 'react-redux';
import { fetchExplorer } from '../actions/analyticsActions';
import PropTypes from 'prop-types';
import _ from 'lodash';
import '../assets/data-table/datatables';
import { CSVLink } from 'react-csv';

class Explorer extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            currentStartDate: moment(new Date('2017-12-15T10:00:00')),
            currentEndDate: moment(),
            priorStartDate: moment(new Date('2017-12-10T10:00:00')),
            priorEndDate: moment().add(-10, 'days'),
            group1Active: 'Sessions',
            group2Active: 'Total',
            rawDataValuesOne: [],
            rawDataValuesTwo: [],
            percentageValuesOne: [],
            percentageValuesTwo: [],
            loading: true,
            currentAnalytics: [],
            priorAnalytics: [],
            reportMappings: {
                'Sessions': 'sessions',
                'Transactions': 'transactions',
                'BounceRate': 'bounceRate',
                'ConversionRate': 'conversionRate',
                'TimeSpent': 'averageTime',
                'Total': '',
                'Device': 'category',
                'Channel': 'medium',
                'LandingPage': 'landingpath'
            },
            currentReportOptions: {
                total: "",
                sessions: "",
                transactions: "",
                bounceRate: "",
                conversionRate: "",
                averageTime: ""
            },
            rawDataReport: [],
            percentageReport: []
        };
        this.handleCurrentStartDateChange = this.handleCurrentStartDateChange.bind(this);
        this.handleCurrentEndDateChange = this.handleCurrentEndDateChange.bind(this);
        this.handlePriorStartDateChange = this.handlePriorStartDateChange.bind(this);
        this.handlePriorEndDateChange = this.handlePriorEndDateChange.bind(this);
        this.setGroup1Active = this.setGroup1Active.bind(this);
        this.setGroup2Active = this.setGroup2Active.bind(this);
    }

    /**
     * convert numbers to comma separated string
     * @param obj
     * @return converted string
     * etc
     */
    convertObjectToComma(obj) {
        for (var key in obj) {
            obj[key] = this.numberWithCommas(obj[key]);
        }

        return obj;
    }

    /**
     * get filtered list by groupByAttr
     * @param analytics, groupByAttr
     * @return filtered list
     * etc
     */
    getFilteredList(analytics, groupByAttr) {
        let _filteredList = [];

        _filteredList = _(analytics)
            .groupBy(groupByAttr)
            .map((objs, key) => {
                if (groupByAttr === '')
                    key = 'Total';

                return {
                    'xValue': key.substring(0, 10),
                    'xValue': key,
                    'sessions': _.sumBy(objs, (s) => {
                        return parseInt(s.sessions, 10);
                    }),                    'transactions': _.sumBy(objs, (s) => {
                        return parseInt(s.transactions, 10);
                    }),
                    'bounceRate': _.sumBy(objs, (s) => {
                        return parseInt(s.bounces, 10);
                    }) / _.sumBy(objs, (s) => {
                        return parseInt(s.visits, 10);
                    }) * 100,
                    'conversionRate': _.sumBy(objs, (s) => {
                        return parseInt(s.transactions, 10);
                    }) / _.sumBy(objs, (s) => {
                        return parseInt(s.visits, 10);
                    }) * 100,
                    'averageTime': _.sumBy(objs, (s) => {
                        return parseInt(s["sessionduration"], 10);
                    }) / _.sumBy(objs, (s) => {
                        return parseInt(s.sessions, 10);
                    }) / 60
                };
            })
            .value();

        return _filteredList;
    }

    /**
     * set RawData values
     * @param
     * @return
     * etc
     */
    setRawDataValues() {
        let groupBy = this.state.reportMappings[this.state.group2Active];

        let analytics = this.state.currentAnalytics;

        var rawDataValuesOne = this.getFilteredList(analytics, 'date');

        let reportOptions = { ...this.state.currentReportOptions };

        let totalSessions = 0,
            totalTransactions = 0,
            totalBounces = 0,
            totalVisits = 0,
            totalDuration = 0;

        analytics.forEach((element) => {
            totalSessions += parseInt(element.sessions, 10);
            totalTransactions += parseInt(element.transactions, 10);
            totalBounces += parseInt(element.bounces, 10);
            totalVisits += parseInt(element.visits, 10);
            totalDuration += parseInt(element["sessionduration"], 10);
        });

        reportOptions.sessions = totalSessions;
        reportOptions.transactions = totalTransactions;
        reportOptions.bounceRate = totalBounces / totalVisits * 100;
        reportOptions.conversionRate = totalTransactions / totalVisits * 100;
        reportOptions.averageTime = totalDuration / totalVisits / 60;

        //Get reports data for barchart
        var rawDataValuesTwo = this.getFilteredList(analytics, groupBy);

        let rawDataReport = [];
        if (groupBy === 'total')
            rawDataReport.push(this.convertObjectToComma(reportOptions));
        else
            rawDataReport = rawDataValuesTwo;

        this.initDataTableForRawData($(this.rawDataTable), rawDataReport);
        this.setState({ rawDataReport });
        this.setState({ currentReportOptions : reportOptions });
        this.setState({ rawDataValuesOne: rawDataValuesOne });
        this.setState({ rawDataValuesTwo: rawDataValuesTwo });
    }

    setPercentageValues() {
        let groupBy = this.state.reportMappings[this.state.group2Active];

        let analytics = this.state.priorAnalytics;

        var percentageValuesOne = this.getFilteredList(analytics, 'date');
        var rawDataValuesOne = { ...this.state.rawDataValuesOne };

        for (let i = 0; i < percentageValuesOne.length; i++) {
            if (typeof percentageValuesOne[i] == "undefined" ||
                typeof rawDataValuesOne[i] == "undefined") {
                percentageValuesOne[i].sessionsChg = 0;
                percentageValuesOne[i].transactionsChg = 0;
                percentageValuesOne[i].bounceRateChg = 0;
                percentageValuesOne[i].conversionRateChg = 0;
                percentageValuesOne[i].averageTimeChg = 0;
                continue;
            }

            percentageValuesOne[i].sessionsChg = percentageValuesOne[i].sessions != 0 ? (rawDataValuesOne[i].sessions / percentageValuesOne[i].sessions - 1) * 100 : 0;
            percentageValuesOne[i].transactionsChg = percentageValuesOne[i].transactions != 0 ? (rawDataValuesOne[i].transactions / percentageValuesOne[i].transactions - 1) * 100 : 0;
            percentageValuesOne[i].bounceRateChg = percentageValuesOne[i].bounceRate != 0 ? (rawDataValuesOne[i].bounceRate / percentageValuesOne[i].bounceRate - 1) * 100 : 0;
            percentageValuesOne[i].conversionRateChg = percentageValuesOne[i].conversionRate != 0 ? (rawDataValuesOne[i].conversionRate / percentageValuesOne[i].conversionRate - 1) * 100 : 0;
            percentageValuesOne[i].averageTimeChg = percentageValuesOne[i].averageTime != 0 ? (rawDataValuesOne[i].averageTime / percentageValuesOne[i].averageTime - 1) * 100 : 0;
        }

        let currentReportOptions = { ...this.state.currentReportOptions };
        let priorReportOptions = {};

        let totalSessions = 0,
            totalTransactions = 0,
            totalBounces = 0,
            totalVisits = 0,
            totalDuration = 0;

        analytics.forEach((element) => {
            totalSessions += parseInt(element.sessions, 10);
            totalTransactions += parseInt(element.transactions, 10);
            totalBounces += parseInt(element.bounces, 10);
            totalVisits += parseInt(element.visits, 10);
            totalDuration += parseInt(element["sessionduration"], 10);
        });

        priorReportOptions.sessions = totalSessions;
        priorReportOptions.sessionsChg = (currentReportOptions.sessions-totalSessions)/totalSessions * 100;
        priorReportOptions.transactions = totalTransactions;
        priorReportOptions.transactionsChg = (currentReportOptions.transactions-totalTransactions)/totalTransactions * 100;
        priorReportOptions.bounceRate = totalBounces / totalVisits * 100;
        priorReportOptions.bounceRateChg = (currentReportOptions.bounceRate-priorReportOptions.bounceRate)/priorReportOptions.bounceRate * 100;
        priorReportOptions.conversionRate = totalTransactions / totalVisits * 100;
        priorReportOptions.conversionRateChg = (currentReportOptions.conversionRate-priorReportOptions.conversionRate)/priorReportOptions.conversionRate * 100;
        priorReportOptions.averageTime = totalDuration / totalVisits / 60;
        priorReportOptions.averageTimeChg = (currentReportOptions.averageTime-priorReportOptions.averageTime)/priorReportOptions.averageTime * 100;

        //Get reports data for barchart
        var percentageValuesTwo = this.getFilteredList(analytics, groupBy);
        var rawDataValuesTwo = { ...this.state.rawDataValuesTwo };

        let percentageReport = [];
        if (groupBy === 'total')
            percentageReport.push(this.convertObjectToComma(priorReportOptions));
        else {
            for (let i = 0; i < percentageValuesTwo.length; i++) {
                if (typeof rawDataValuesTwo[i] == "undefined" ||
                    typeof percentageValuesTwo[i] == "undefined") {
                    percentageValuesTwo[i].sessionsChg = 0;
                    percentageValuesTwo[i].transactionsChg = 0;
                    percentageValuesTwo[i].bounceRateChg = 0;
                    percentageValuesTwo[i].conversionRateChg = 0;
                    percentageValuesTwo[i].averageTimeChg = 0;
                    continue;
                }
                percentageValuesTwo[i].sessionsChg = percentageValuesTwo[i].sessions != 0 ? (rawDataValuesTwo[i].sessions / percentageValuesTwo[i].sessions - 1) * 100 : 0;
                percentageValuesTwo[i].transactionsChg = percentageValuesTwo[i].transactions != 0 ? (rawDataValuesTwo[i].transactions / percentageValuesTwo[i].transactions - 1) * 100 : 0;
                percentageValuesTwo[i].bounceRateChg = percentageValuesTwo[i].bounceRate != 0 ? (rawDataValuesTwo[i].bounceRate / percentageValuesTwo[i].bounceRate - 1) * 100 : 0;
                percentageValuesTwo[i].conversionRateChg = percentageValuesTwo[i].conversionRate != 0 ? (rawDataValuesTwo[i].conversionRate / percentageValuesTwo[i].conversionRate - 1) * 100 : 0;
                percentageValuesTwo[i].averageTimeChg = percentageValuesTwo[i].averageTime != 0 ? (rawDataValuesTwo[i].averageTime / percentageValuesTwo[i].averageTime - 1) * 100 : 0;
            }
            percentageReport = percentageValuesTwo;
        }


        this.initDataTableForPercentage($(this.percentageTable), percentageReport);

        this.setState({ percentageReport });
        this.setState({ percentageValuesOne: percentageValuesOne });
        this.setState({ percentageValuesTwo: percentageValuesTwo });
    }

    initDataTableForRawData(elm, analysisResult) {
        elm.DataTable({
            destroy: true,
            data: analysisResult,
            columns: [
                { "data": "xValue" },
                {
                    "data": "sessions",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',').display(data);
                        return num;
                    }
                },
                {
                    "data": "transactions",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',').display(data);
                        return num;
                    }
                },
                {
                    "data": "bounceRate",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num + ' ' + '%';
                    }
                },
                {
                    "data": "conversionRate",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num + ' ' + '%';
                    }
                },
                {
                    "data": "averageTime",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num;
                    }
                }
            ]
        });
    }

    initDataTableForPercentage(elm, analysisResult) {
        elm.DataTable({
            destroy: true,
            data: analysisResult,
            "columnDefs": [
                { "width": "50px", "targets": 0 }
            ],
            columns: [
                { "data": "xValue" },
                {
                    "data": "sessions",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',').display(data);
                        return num;
                    }
                },
                {
                    "data": "sessionsChg",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num + ' ' + '%';
                    }
                },
                {
                    "data": "transactions",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',').display(data);
                        return num;
                    }
                },
                {
                    "data": "transactionsChg",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num + ' ' + '%';
                    }
                },
                {
                    "data": "bounceRate",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num + ' ' + '%';
                    }
                },
                {
                    "data": "bounceRateChg",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num + ' ' + '%';
                    }
                },
                {
                    "data": "conversionRate",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num + ' ' + '%';
                    }
                },
                {
                    "data": "conversionRateChg",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num + ' ' + '%';
                    }
                },
                {
                    "data": "averageTime",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num;
                    }
                },
                {
                    "data": "averageTimeChg",
                    render: function (data, type, row, meta) {
                        var num = $.fn.dataTable.render.number(',', '.', 2).display(data);
                        return num + ' ' + '%';
                    }
                },
            ]
        });
    }

    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    fetchExplorerData() {
        let currentStartDate = this.state.currentStartDate.format('YYYYMMDD').replace(/-/gi, '');
        let currentEndDate = this.state.currentEndDate.format('YYYYMMDD').replace(/-/gi, '');

        let priorStartDate = this.state.priorStartDate.format('YYYYMMDD').replace(/-/gi, '');
        let priorEndDate = this.state.priorEndDate.format('YYYYMMDD').replace(/-/gi, '');

        let p1 = new Promise((resolve, reject) => {
            this.props.fetchExplorer(currentStartDate, currentEndDate).then(res => {
                let { analytics } = this.props;
                this.setState({ currentAnalytics: analytics });

                resolve();
            }, err => {
                reject(err);
            });
        })

        let p2 = new Promise((resolve, reject) => {
            this.props.fetchExplorer(priorStartDate, priorEndDate).then(res => {
                let { analytics } = this.props;
                this.setState({ priorAnalytics: analytics });

                resolve();
            }, err => {
                reject(err);
            });
        })

        Promise.all([p1, p2]).then(() => {
            this.setRawDataValues();
            this.setPercentageValues();
            this.setState({ loading: false });
        }, err => {

        });
    }


    componentWillUpdate(nextProps, nextState) {
        if (this.state.currentStartDate !== nextState.currentStartDate ||
        this.state.currentEndDate !== nextState.currentEndDate ||
        this.state.priorStartDate !== nextState.priorStartDate ||
        this.state.priorEndDate !== nextState.priorEndDate) {
            this.setState({loading: true});
        }
    }

    componentDidCatch(error, info) {
        logComponentStackToMyService(info.componentStack);
    }

    componentDidMount() {
        this.fetchExplorerData();
    }

    rateFormatter(cell) {
        return cell + '%';
    }

    setGroup1Active(e) {
        this.setState({ group1Active: e.target.value }, () => {
            var promise = new Promise((resolve, reject) => {
                this.setRawDataValues();
                resolve();
            });
            promise.then(() => {
                this.setPercentageValues();
            }, err => {

            });
        });
    }

    setGroup2Active(e) {
        this.setState({ group2Active: e.target.value }, () => {
            var promise = new Promise((resolve, reject) => {
                this.setRawDataValues();
                resolve();
            });
            promise.then(() => {
                this.setPercentageValues();
            }, err => {

            });
        });
    }

    handleCurrentStartDateChange(date) {
        this.setState({
            currentStartDate: date
        }, () => {
            this.fetchExplorerData();
        });
    }

    handleCurrentEndDateChange(date) {
        this.setState({
            currentEndDate: date
        }, () => {
            this.fetchExplorerData();
        });
    }

    handlePriorStartDateChange(date) {
        this.setState({
            priorStartDate: date
        }, () => {
            this.fetchExplorerData();
        });
    }

    handlePriorEndDateChange(date) {
        this.setState({
            priorEndDate: date
        }, () => {
            this.fetchExplorerData();
        });
    }

    render() {
        const loading = (
            <div className="ui active centered inline loader"></div>
        );

        const smoothChartForRawData = (
            <AmCharts.React
                style={{
                    width: "100%",
                    height: "500px"
                }}
                options={{
                    "type": "serial",
                    "theme": "light",
                    "graphs": [{
                        "id": "g1",
                        "balloonText": "[[category]]<br><b><span style='font-size:14px;'>[[value]]</span></b>",
                        "bullet": "round",
                        "bulletSize": 4,
                        "lineColor": "#3962B7",
                        "lineThickness": 2,
                        "negativeLineColor": "#637bb6",
                        "type": "smoothedLine",
                        "valueField": this.state.reportMappings[this.state.group1Active]
                    }],
                    "dataProvider": this.state.rawDataValuesOne,
                    "titles": [{
                        "text": this.state.group1Active
                    }],
                    "chartScrollbar": {
                        "graph": "g1",
                        "gridAlpha": 0,
                        "color": "#888888",
                        "scrollbarHeight": 55,
                        "backgroundAlpha": 0,
                        "selectedBackgroundAlpha": 0.1,
                        "selectedBackgroundColor": "#888888",
                        "graphFillAlpha": 0,
                        "autoGridCount": true,
                        "selectedGraphFillAlpha": 0,
                        "graphLineAlpha": 0.2,
                        "graphLineColor": "#c2c2c2",
                        "selectedGraphLineColor": "#888888",
                        "selectedGraphLineAlpha": 1
                    },
                    "chartCursor": {
                        "categoryBalloonDateFormat": "MMM DD YYYY",
                        "cursorAlpha": 0,
                        "valueLineEnabled": true,
                        "valueLineBalloonEnabled": true,
                        "valueLineAlpha": 0.5,
                        "fullWidth": true
                    },
                    "dataDateFormat": "YYYYMMDD",
                    "categoryField": "xValue",
                    "categoryAxis": {
                        "minPeriod": "DD",
                        "parseDates": true,
                        "minorGridAlpha": 0.1,
                        "minorGridEnabled": true,
                        "dateFormats": [{ "period": "fff", "format": "JJ:NN:SS" },
                        { "period": "ss", "format": "JJ:NN:SS" },
                        { "period": "mm", "format": "JJ:NN" },
                        { "period": "hh", "format": "JJ:NN" },
                        { "period": "DD", "format": "MMM DD" },
                        { "period": "WW", "format": "MMM DD" },
                        { "period": "MM", "format": "MMM YYYY" },
                        { "period": "YYYY", "format": "YYYY" }]
                    },
                    "export": {
                        "enabled": true
                    }
                }} />
        );

        const barChartForRawData = (
            <AmCharts.React
                style={{
                    width: "100%",
                    height: "500px"
                }}
                options={{
                    "type": "serial",
                    "theme": "light",
                    "dataProvider": this.state.rawDataValuesTwo,
                    "titles": [{
                        "text": this.state.group2Active
                    }],
                    "valueAxes": [{
                        "gridColor": "#FFFFFF",
                        "gridAlpha": 0.2,
                        "dashLength": 0
                    }],
                    "gridAboveGraphs": true,
                    "startDuration": 1,
                    "graphs": [{
                        "balloonText": "[[category]]: <b>[[value]]</b>",
                        "fillAlphas": 0.8,
                        "lineAlpha": 0.2,
                        "type": "column",
                        "valueField": this.state.reportMappings[this.state.group1Active],
                        "lineColor": "#3962B7"
                    }],
                    "chartCursor": {
                        "categoryBalloonEnabled": false,
                        "cursorAlpha": 0,
                        "zoomable": false
                    },
                    "categoryField": "xValue",
                    "categoryAxis": {
                        "gridPosition": "start",
                        "labelRotation": 45,
                    },
                    "export": {
                        "enabled": true
                    }
                }} />
        );

        const smoothChartForPercentage = (
            <AmCharts.React
                style={{
                    width: "100%",
                    height: "500px"
                }}
                options={{
                    "type": "serial",
                    "theme": "light",
                    "graphs": [{
                        "id": "g1",
                        "balloonText": "[[category]]<br><b><span style='font-size:14px;'>[[value]]%</span></b>",
                        "bullet": "round",
                        "bulletSize": 4,
                        "lineColor": "#3962B7",
                        "lineThickness": 2,
                        "negativeLineColor": "#637bb6",
                        "type": "smoothedLine",
                        "valueField": this.state.reportMappings[this.state.group1Active] + 'Chg'
                    }],
                    "dataProvider": this.state.percentageValuesOne,
                    "titles": [{
                        "text": this.state.group1Active
                    }],
                    "chartScrollbar": {
                        "graph": "g1",
                        "gridAlpha": 0,
                        "color": "#888888",
                        "scrollbarHeight": 55,
                        "backgroundAlpha": 0,
                        "selectedBackgroundAlpha": 0.1,
                        "selectedBackgroundColor": "#888888",
                        "graphFillAlpha": 0,
                        "autoGridCount": true,
                        "selectedGraphFillAlpha": 0,
                        "graphLineAlpha": 0.2,
                        "graphLineColor": "#c2c2c2",
                        "selectedGraphLineColor": "#888888",
                        "selectedGraphLineAlpha": 1
                    },
                    "valueAxes": [{
                        "gridColor": "#FFFFFF",
                        "gridAlpha": 0.2,
                        "dashLength": 0,
                        "unit": "%",
                    }],
                    "chartCursor": {
                        "categoryBalloonDateFormat": "MMM DD YYYY",
                        "cursorAlpha": 0,
                        "valueLineEnabled": true,
                        "valueLineBalloonEnabled": true,
                        "valueLineAlpha": 0.5,
                        "fullWidth": true
                    },
                    "dataDateFormat": "YYYYMMDD",
                    "categoryField": "xValue",
                    "categoryAxis": {
                        "minPeriod": "DD",
                        "parseDates": true,
                        "minorGridAlpha": 0.1,
                        "minorGridEnabled": true,
                        "dateFormats": [{ "period": "fff", "format": "JJ:NN:SS" },
                        { "period": "ss", "format": "JJ:NN:SS" },
                        { "period": "mm", "format": "JJ:NN" },
                        { "period": "hh", "format": "JJ:NN" },
                        { "period": "DD", "format": "MMM DD" },
                        { "period": "WW", "format": "MMM DD" },
                        { "period": "MM", "format": "MMM YYYY" },
                        { "period": "YYYY", "format": "YYYY" }]
                    },
                    "export": {
                        "enabled": true
                    }
                }} />
        );

        const barChartForPercentage = (
            <AmCharts.React
                style={{
                    width: "100%",
                    height: "500px"
                }}
                options={{
                    "type": "serial",
                    "theme": "light",
                    "dataProvider": this.state.percentageValuesTwo,
                    "titles": [{
                        "text": this.state.group2Active
                    }],
                    "valueAxes": [{
                        "axisAlpha": 0,
                        "position": "left",
                        "unit": "%",
                    }],
                    "gridAboveGraphs": true,
                    "startDuration": 1,
                    "graphs": [{
                        "balloonText": "[[category]]: <b>[[value]]%</b>",
                        "fillAlphas": 0.8,
                        "lineAlpha": 0.2,
                        "type": "column",
                        "valueField": this.state.reportMappings[this.state.group1Active] + 'Chg',
                        "lineColor": "#3962B7"
                    }],
                    "chartCursor": {
                        "categoryBalloonEnabled": false,
                        "cursorAlpha": 0,
                        "zoomable": false
                    },
                    "categoryField": "xValue",
                    "categoryAxis": {
                        "gridPosition": "start",
                        "labelRotation": 45,
                    },
                    "export": {
                        "enabled": true
                    }
                }} />
        );

        return (
            <div className="explorer-container">
                <h6>Current Period</h6>
                <div className="row">
                    <div className="col-md-3">
                        <div className="row">
                            <div className="col-md-6">
                                <DatePicker
                                    selected={this.state.currentStartDate}
                                    onChange={this.handleCurrentStartDateChange}
                                    className="form-control"
                                />
                            </div>
                            <div className="col-md-6">
                                <DatePicker
                                    selected={this.state.currentEndDate}
                                    onChange={this.handleCurrentEndDateChange}
                                    className="form-control"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-5">
                        <div className="btn-group1">
                            <label className={classnames('btn', 'btn-default', { 'active': this.state.group1Active == 'Sessions' })}>
                                <input type="radio"
                                    name="group1"
                                    value="Sessions"
                                    className="btn btn-default"
                                    defaultChecked={true}
                                    onChange={this.setGroup1Active} />
                                Sessions
                            </label>
                            <label className={classnames('btn', 'btn-default', { 'active': this.state.group1Active == 'Transactions' })}>
                                <input type="radio"
                                    name="group1"
                                    value="Transactions"
                                    className="btn btn-default"
                                    onChange={this.setGroup1Active} />
                                Transactions
                            </label>
                            <label className={classnames('btn', 'btn-default', { 'active': this.state.group1Active == 'BounceRate' })}>
                                <input type="radio"
                                    name="group1"
                                    value="BounceRate"
                                    className="btn btn-default"
                                    onChange={this.setGroup1Active} />
                                BounceRate
                            </label>
                            <label className={classnames('btn', 'btn-default', { 'active': this.state.group1Active == 'ConversionRate' })}>
                                <input type="radio"
                                    name="group1"
                                    value="ConversionRate"
                                    className="btn btn-default"
                                    onChange={this.setGroup1Active} />
                                ConversionRate
                            </label>
                            <label className={classnames('btn', 'btn-default', { 'active': this.state.group1Active == 'TimeSpent' })}>
                                <input type="radio"
                                    name="group1"
                                    value="TimeSpent"
                                    className="btn btn-default"
                                    onChange={this.setGroup1Active} />
                                TimeSpent
                            </label>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="btn-group2">
                            <label className={classnames('btn', 'btn-default', { 'active': this.state.group2Active == 'Total' })}>
                                <input type="radio"
                                    className="btn btn-default"
                                    name="group2"
                                    value="Total"
                                    onChange={this.setGroup2Active} />
                                Total
                            </label>
                            <label className={classnames('btn', 'btn-default', { 'active': this.state.group2Active == 'Device' })}>
                                <input type="radio"
                                    className="btn btn-default"
                                    name="group2"
                                    value="Device"
                                    onChange={this.setGroup2Active} />
                                Device
                            </label>
                            <label className={classnames('btn', 'btn-default', { 'active': this.state.group2Active == 'Channel' })}>
                                <input type="radio"
                                    className="btn btn-default"
                                    name="group2"
                                    value="Channel"
                                    onChange={this.setGroup2Active} />
                                Channel
                            </label>
                            <label className={classnames('btn', 'btn-default', { 'active': this.state.group2Active == 'LandingPage' })}>
                                <input type="radio"
                                    className="btn btn-default"
                                    name="group2"
                                    value="LandingPage"
                                    onChange={this.setGroup2Active} />
                                LandingPage
                            </label>
                        </div>
                    </div>
                </div>
                <div className="">
                    <ul className="nav nav-tabs" role="tablist">
                        <li className="nav-item">
                            <a className="nav-link active" href="#raw-data" role="tab" data-toggle="tab">Raw data</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#percentage-changes" role="tab" data-toggle="tab">Percentage Changes</a>
                        </li>
                    </ul>

                    <div className="clear"></div>
                    <div className="tab-content">
                        <div role="tabpanel" className="tab-pane fade in active show" id="raw-data">
                            <div className="row">
                                <div className="col-md-6">
                                    {this.state.loading ? loading : smoothChartForRawData}
                                </div>
                                <div className="col-md-6">
                                    {this.state.loading ? loading : barChartForRawData}
                                </div>
                            </div>
                            <div className="row">
                                <CSVLink data={this.state.rawDataReport}
                                    filename={"my-file.csv"}
                                    className="btn btn-default"
                                    target="_blank">
                                    <i className="fa fa-download" aria-hidden="true"></i>
                                    &nbsp;Export Table
                                </CSVLink>
                            </div>
                            <div className={classnames('table-block', {'d-none' : this.state.loading})}>
                                <div className="">
                                    <table className="ui celled table"
                                        cellSpacing="0"
                                        ref={(el) => this.rawDataTable = el}
                                        width="100%">
                                        <thead>
                                            <tr>
                                                <th>{this.state.group2Active}</th>
                                                <th>Sessions</th>
                                                <th>Transactions</th>
                                                <th>Bounce Rate</th>
                                                <th>Conversion Rate</th>
                                                <th>Average Time Spent on Site</th>
                                            </tr>
                                        </thead>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <div role="tabpanel" className="tab-pane fade" id="percentage-changes">
                            <div className="row">
                                <h6>Prior Period</h6>
                            </div>
                            <div className="row">
                                <div className="row">
                                    <div className="col-md-6">
                                        <DatePicker
                                            selected={this.state.priorStartDate}
                                            onChange={this.handlePriorStartDateChange}
                                            className="form-control"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <DatePicker
                                            selected={this.state.priorEndDate}
                                            onChange={this.handlePriorEndDateChange}
                                            className="form-control"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-6">
                                    {this.state.loading ? loading : smoothChartForPercentage}
                                </div>
                                <div className="col-md-6">
                                    {this.state.loading ? loading : barChartForPercentage}
                                </div>
                            </div>
                            <div className="row">
                                <CSVLink data={this.state.percentageReport}
                                    filename={"my-file.csv"}
                                    className="btn btn-default"
                                    target="_blank">
                                    <i className="fa fa-download" aria-hidden="true"></i>
                                    &nbsp;Export Table
                                </CSVLink>
                            </div>
                            <div className={classnames('table-block', { 'd-none': this.state.loading })}>
                                <div className="">
                                    <table className="ui celled table"
                                        cellSpacing="0"
                                        ref={(el) => this.percentageTable = el}
                                        width="100%">
                                        <thead>
                                            <tr>
                                                <th>{this.state.group2Active}</th>
                                                <th>sessions</th>
                                                <th>sessions(%chg)</th>
                                                <th>transactions</th>
                                                <th>transactions(%chg)</th>
                                                <th>bounceRate</th>
                                                <th>bounceRate(%chg)</th>
                                                <th>conversionRate</th>
                                                <th>conversionRate(%chg)</th>
                                                <th>timeSpent</th>
                                                <th>timeSpent(%chg)</th>
                                            </tr>
                                        </thead>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

Explorer.propTypes = {
    analytics: PropTypes.array.isRequired
}

function mapStateToProps(state) {
    return {
        analytics: state.explorer
    };
}

export default connect(mapStateToProps, { fetchExplorer })(Explorer);
