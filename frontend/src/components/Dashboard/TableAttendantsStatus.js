import React from "react";

import Paper from "@material-ui/core/Paper";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Skeleton from "@material-ui/lab/Skeleton";

import { makeStyles } from "@material-ui/core/styles";
import { green, red } from '@material-ui/core/colors';

import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import moment from 'moment';

import Rating from '@material-ui/lab/Rating';
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	on: {
		color: "#4caf50",
		fontSize: '24px',
		filter: "drop-shadow(0 2px 4px rgba(76, 175, 80, 0.3))",
		transition: "all 0.3s ease"
	},
	off: {
		color: "#f44336",
		fontSize: '24px',
		filter: "drop-shadow(0 2px 4px rgba(244, 67, 54, 0.3))",
		transition: "all 0.3s ease"
	},
    pointer: {
        cursor: "pointer"
    },
	tableContainer: {
		borderRadius: 16,
		boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
		overflow: "hidden",
		background: theme.palette.type === 'dark' ? theme.palette.background.paper : "#ffffff",
	},
	tableHead: {
		background: theme.palette.type === 'dark' 
			? "linear-gradient(135deg, #424242 0%, #616161 100%)"
			: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
	},
	tableHeadCell: {
		color: "#ffffff",
		fontWeight: 600,
		fontSize: "14px",
		letterSpacing: "0.5px",
		borderBottom: "none",
		padding: theme.spacing(2),
	},
	tableRow: {
		"&:hover": {
			backgroundColor: theme.palette.type === 'dark' 
				? "rgba(255, 255, 255, 0.05)"
				: "rgba(102, 126, 234, 0.05)",
			transition: "background-color 0.3s ease"
		},
		borderBottom: "1px solid rgba(224, 224, 224, 0.1)"
	},
	tableCell: {
		borderBottom: "1px solid rgba(224, 224, 224, 0.1)",
		padding: theme.spacing(2),
		fontSize: "14px",
	},
	statusBadge: {
		padding: "4px 12px",
		borderRadius: "20px",
		fontSize: "12px",
		fontWeight: 600,
		display: "inline-flex",
		alignItems: "center",
		gap: "6px"
	},
	onlineBadge: {
		background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
		color: "#ffffff",
	},
	offlineBadge: {
		background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
		color: "#ffffff",
	}
}));

export function RatingBox ({ rating }) {
    const ratingTrunc = rating === null ? 0 : Math.trunc(rating);
    return <Rating
        defaultValue={ratingTrunc}
        max={3}
        readOnly
    />
}

export default function TableAttendantsStatus(props) {
    const { loading, attendants } = props
	const classes = useStyles();

    function renderList () {
        return attendants.map((a, k) => (
            <TableRow key={k} className={classes.tableRow}>
                <TableCell className={classes.tableCell}>
                    <span style={{ fontWeight: 500 }}>{a.name}</span>
                </TableCell>
                <TableCell align="center" title={i18n.t("dashboard.onlineTable.ratingLabel")} className={`${classes.pointer} ${classes.tableCell}`}>
                    <RatingBox rating={a.rating} />
                </TableCell>
                <TableCell align="center" className={classes.tableCell}>
                    <span style={{ fontWeight: 500, color: "#666" }}>{formatTime(a.avgSupportTime, 2)}</span>
                </TableCell>
                <TableCell align="center" className={classes.tableCell}>
                    { a.online ?
                        <span className={`${classes.statusBadge} ${classes.onlineBadge}`}>
                            <CheckCircleIcon style={{ fontSize: 16 }} />
                            Online
                        </span>
                        : <span className={`${classes.statusBadge} ${classes.offlineBadge}`}>
                            <ErrorIcon style={{ fontSize: 16 }} />
                            Offline
                        </span>
                    }
                </TableCell>
            </TableRow>
        ))
    }

	function formatTime(minutes){
		return moment().startOf('day').add(minutes, 'minutes').format('HH[h] mm[m]');
	}

    return ( !loading ?
        <TableContainer component={Paper} className={classes.tableContainer} elevation={0}>
            <Table>
                <TableHead className={classes.tableHead}>
                    <TableRow>
                        <TableCell className={classes.tableHeadCell}>{i18n.t("dashboard.onlineTable.name")}</TableCell>
                        <TableCell align="center" className={classes.tableHeadCell}>{i18n.t("dashboard.onlineTable.ratings")}</TableCell>
                        <TableCell align="center" className={classes.tableHeadCell}>{i18n.t("dashboard.onlineTable.avgSupportTime")}</TableCell>
                        <TableCell align="center" className={classes.tableHeadCell}>{i18n.t("dashboard.onlineTable.status")}</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    { renderList() }
                </TableBody>
            </Table>
        </TableContainer>
        : <Skeleton variant="rect" height={150} style={{ borderRadius: 16 }} />
    )
}