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
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import brLocale from 'date-fns/locale/pt-BR';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { Button, Stack, TextField } from '@mui/material';
import Typography from "@material-ui/core/Typography";
import api from '../../services/api';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import './button.css';
import { i18n } from '../../translate/i18n';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
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
            text: i18n.t("dashboard.charts.date.label"),
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
            display: false  // Desabilitado para un look más limpio
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
                    size: 11,
                    weight: '500'
                },
                color: '#666',
                padding: 8,
                maxRotation: 45,
                minRotation: 45
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

export const ChartsDate = () => {

    const [initialDate, setInitialDate] = useState(new Date());
    const [finalDate, setFinalDate] = useState(new Date());
    const [ticketsData, setTicketsData] = useState({ data: [], count: 0 });

    const companyId = localStorage.getItem("companyId");

    useEffect(() => {
        handleGetTicketsInformation();
    }, []);

    const dataCharts = {
        labels: ticketsData && ticketsData?.data.length > 0 && ticketsData?.data.map((item) => (item.hasOwnProperty('horario') ? `${item.horario}:00` : item.data)),
        datasets: [
            {
                data: ticketsData?.data.length > 0 && ticketsData?.data.map((item, index) => {
                    return item.total
                }),
                backgroundColor: 'rgba(67, 233, 123, 0.6)',
                borderColor: 'rgba(67, 233, 123, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false,
                hoverBackgroundColor: 'rgba(67, 233, 123, 0.8)',
            },
        ],
    };

    const handleGetTicketsInformation = async () => {
        try {
            const { data } = await api.get(`/dashboard/ticketsDay?initialDate=${format(initialDate, 'yyyy-MM-dd')}&finalDate=${format(finalDate, 'yyyy-MM-dd')}&companyId=${companyId}`);
            setTicketsData(data);
        } catch (error) {
            toast.error(i18n.t("dashboard.toasts.dateChartError"));
        }
    }

    return (
        <>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>
                {i18n.t("dashboard.charts.date.title")} ({ticketsData?.count})
            </Typography>

            <Stack direction={'row'} spacing={2} alignItems={'center'} sx={{ my: 2, }} >

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                    <DatePicker
                        value={initialDate}
                        onChange={(newValue) => { setInitialDate(newValue) }}
                        label={i18n.t("dashboard.charts.date.start")}
                        renderInput={(params) => <TextField fullWidth {...params} sx={{ width: '20ch' }} />}

                    />
                </LocalizationProvider>

                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                    <DatePicker
                        value={finalDate}
                        onChange={(newValue) => { setFinalDate(newValue) }}
                        label={i18n.t("dashboard.charts.date.end")}
                        renderInput={(params) => <TextField fullWidth {...params} sx={{ width: '20ch' }} />}
                    />
                </LocalizationProvider>

                <Button className="buttonHover" onClick={handleGetTicketsInformation} variant='contained' >
                    {i18n.t("dashboard.charts.date.filter")}
                </Button>

            </Stack>
            <div style={{ position: 'relative', height: '250px', width: '100%', overflow: 'hidden' }}>
                <Bar options={options} data={dataCharts} />
            </div>
        </>
    );
}