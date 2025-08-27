import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import brLocale from 'date-fns/locale/pt-BR';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { Button, Stack, TextField } from '@mui/material';
import Typography from "@material-ui/core/Typography";
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import './button.css';
import { i18n } from '../../translate/i18n';

const useStyles = makeStyles((theme) => ({
    container: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.padding,
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(2),
    }
}));

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartDataLabels
);

export const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            display: false,
        },
        title: {
            display: true,
            text: i18n.t("dashboard.charts.user.label"),
            position: 'left',
            font: {
                size: 16,
                weight: '600',
                family: "'Roboto', sans-serif"
            },
            color: '#333',
            padding: {
                top: 10,
                bottom: 20
            }
        },
        datalabels: {
            display: true,
            anchor: 'end',
            align: 'top',
            offset: 4,
            color: '#666',
            font: {
                size: 12,
                weight: "600"
            },
            formatter: (value) => {
                return value > 0 ? value : '';
            }
        },
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
                size: 14,
                weight: '600'
            },
            bodyFont: {
                size: 14
            },
            cornerRadius: 8,
            displayColors: false
        }
    },
    scales: {
        x: {
            grid: {
                display: false,
                drawBorder: false
            },
            ticks: {
                font: {
                    size: 12,
                    weight: '500'
                },
                color: '#666',
                padding: 8
            }
        },
        y: {
            grid: {
                drawBorder: false,
                color: 'rgba(0, 0, 0, 0.05)',
                borderDash: [5, 5]
            },
            ticks: {
                font: {
                    size: 12
                },
                color: '#666',
                padding: 8
            },
            beginAtZero: true
        }
    }
};

export const ChatsUser = () => {
    // const classes = useStyles();
    const [initialDate, setInitialDate] = useState(new Date());
    const [finalDate, setFinalDate] = useState(new Date());
    const [ticketsData, setTicketsData] = useState({ data: [] });

    const companyId = localStorage.getItem("companyId");

    useEffect(() => {
        handleGetTicketsInformation();
    }, []);

    const dataCharts = {
        labels: ticketsData && ticketsData?.data.length > 0 && ticketsData?.data.map((item) => item.nome),
        datasets: [
            {
                data: ticketsData?.data.length > 0 && ticketsData?.data.map((item, index) => {
                    return item.quantidade
                }),
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(240, 147, 251, 0.8)',
                    'rgba(245, 87, 108, 0.8)',
                    'rgba(79, 172, 254, 0.8)',
                    'rgba(0, 242, 254, 0.8)',
                    'rgba(250, 112, 154, 0.8)',
                    'rgba(254, 225, 64, 0.8)',
                    'rgba(67, 233, 123, 0.8)',
                    'rgba(56, 249, 215, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)',
                    'rgba(240, 147, 251, 1)',
                    'rgba(245, 87, 108, 1)',
                    'rgba(79, 172, 254, 1)',
                    'rgba(0, 242, 254, 1)',
                    'rgba(250, 112, 154, 1)',
                    'rgba(254, 225, 64, 1)',
                    'rgba(67, 233, 123, 1)',
                    'rgba(56, 249, 215, 1)'
                ],
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
            },
        ],
    };

    const handleGetTicketsInformation = async () => {
        try {

            const { data } = await api.get(`/dashboard/ticketsUsers?initialDate=${format(initialDate, 'yyyy-MM-dd')}&finalDate=${format(finalDate, 'yyyy-MM-dd')}&companyId=${companyId}`);
            setTicketsData(data);
        } catch (error) {
            toast.error(i18n.t("dashboard.toasts.userChartError"));
        }
    }

    return (
        <>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                {i18n.t("dashboard.charts.user.title")}
            </Typography>

            <Stack direction={'row'} spacing={2} alignItems={'center'} sx={{ my: 2, }} >

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                    <DatePicker
                        value={initialDate}
                        onChange={(newValue) => { setInitialDate(newValue) }}
                        label={i18n.t("dashboard.charts.user.start")}
                        renderInput={(params) => <TextField fullWidth {...params} sx={{ width: '20ch' }} />}

                    />
                </LocalizationProvider>

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                    <DatePicker
                        value={finalDate}
                        onChange={(newValue) => { setFinalDate(newValue) }}
                        label={i18n.t("dashboard.charts.user.end")}
                        renderInput={(params) => <TextField fullWidth {...params} sx={{ width: '20ch' }} />}
                    />
                </LocalizationProvider>

                <Button className="buttonHover" onClick={handleGetTicketsInformation} variant='contained'>
                    {i18n.t("dashboard.charts.user.filter")}
                </Button>

            </Stack>
            <div style={{ position: 'relative', height: '250px', width: '100%', overflow: 'hidden' }}>
                <Bar options={options} data={dataCharts} />
            </div>
        </>
    );
}