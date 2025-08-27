import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { makeStyles } from "@material-ui/core/styles";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@material-ui/core";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  HelpOutline as HelpIcon,
  Link as LinkIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from "@material-ui/icons";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(3),
    margin: theme.spacing(2),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  configCard: {
    marginBottom: theme.spacing(2),
    border: "1px solid",
    borderColor: theme.palette.divider,
    borderRadius: theme.spacing(1),
  },
  activeCard: {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  inactiveCard: {
    opacity: 0.7,
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing(2),
  },
  tabPanel: {
    marginTop: theme.spacing(2),
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  helpIcon: {
    fontSize: 18,
    color: theme.palette.text.secondary,
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`webhook-tabpanel-${index}`}
      aria-labelledby={`webhook-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

const WebhookConfig = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [queues, setQueues] = useState([]);
  const [whatsapps, setWhatsapps] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [showAuthToken, setShowAuthToken] = useState(false);

  const [formData, setFormData] = useState({
    integrationId: "",
    webhookUrl: "",
    isActive: true,
    sendNewMessages: true,
    sendWithoutQueue: false,
    sendWithQueue: true,
    sendWithAssignedUser: false,
    sendMediaMessages: true,
    sendOnlyFromQueues: [],
    sendOnlyFromWhatsapps: [],
    requireChatbot: false,
    requireIntegration: false,
    customHeaders: {},
    authType: "none",
    authToken: "",
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
  });

  const [customHeader, setCustomHeader] = useState({ key: "", value: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar integraciones
      const { data: integrationsData } = await api.get("/queueIntegration/");
      setIntegrations(integrationsData.queueIntegrations);

      // Cargar colas
      const { data: queuesData } = await api.get("/queue/");
      setQueues(queuesData);

      // Cargar WhatsApps
      const { data: whatsappsData } = await api.get("/whatsapp/");
      setWhatsapps(whatsappsData);

      // Cargar configuraciones de webhook
      const { data: configsData } = await api.get("/webhook-configs");
      setConfigs(configsData.webhookConfigs);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    // Si se selecciona una integración, usar su webhook URL
    if (field === 'integrationId' && value) {
      const selectedIntegration = integrations.find(i => i.id === value);
      if (selectedIntegration && selectedIntegration.urlN8N) {
        setFormData({ 
          ...formData, 
          [field]: value,
          webhookUrl: selectedIntegration.urlN8N 
        });
        return;
      }
    }
    
    setFormData({ ...formData, [field]: value });
  };

  const handleMultiSelectChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleAddHeader = () => {
    if (customHeader.key && customHeader.value) {
      setFormData({
        ...formData,
        customHeaders: {
          ...formData.customHeaders,
          [customHeader.key]: customHeader.value,
        },
      });
      setCustomHeader({ key: "", value: "" });
    }
  };

  const handleRemoveHeader = (key) => {
    const newHeaders = { ...formData.customHeaders };
    delete newHeaders[key];
    setFormData({ ...formData, customHeaders: newHeaders });
  };

  const handleNewConfig = () => {
    setSelectedConfig(null);
    setFormData({
      integrationId: "",
      webhookUrl: "",
      isActive: true,
      sendNewMessages: true,
      sendWithoutQueue: false,
      sendWithQueue: true,
      sendWithAssignedUser: false,
      sendMediaMessages: true,
      sendOnlyFromQueues: [],
      sendOnlyFromWhatsapps: [],
      requireChatbot: false,
      requireIntegration: false,
      customHeaders: {},
      authType: "none",
      authToken: "",
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 30000,
    });
    setDialogOpen(true);
  };

  const handleEditConfig = (config) => {
    setSelectedConfig(config);
    setFormData({
      integrationId: config.integrationId,
      webhookUrl: config.webhookUrl,
      isActive: config.isActive,
      sendNewMessages: config.sendNewMessages,
      sendWithoutQueue: config.sendWithoutQueue,
      sendWithQueue: config.sendWithQueue,
      sendWithAssignedUser: config.sendWithAssignedUser,
      sendMediaMessages: config.sendMediaMessages,
      sendOnlyFromQueues: config.sendOnlyFromQueues || [],
      sendOnlyFromWhatsapps: config.sendOnlyFromWhatsapps || [],
      requireChatbot: config.requireChatbot,
      requireIntegration: config.requireIntegration,
      customHeaders: config.customHeaders || {},
      authType: config.authType || "none",
      authToken: config.authToken || "",
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      timeout: config.timeout || 30000,
    });
    setDialogOpen(true);
  };

  const handleDeleteConfig = async (configId) => {
    if (window.confirm("¿Está seguro de eliminar esta configuración?")) {
      try {
        await api.delete(`/webhook-configs/${configId}`);
        toast.success("Configuración eliminada correctamente");
        loadData();
      } catch (err) {
        toastError(err);
      }
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      if (selectedConfig) {
        await api.put(`/webhook-configs/${selectedConfig.id}`, formData);
        toast.success("Configuración actualizada correctamente");
      } else {
        await api.post("/webhook-configs", formData);
        toast.success("Configuración creada correctamente");
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  const testWebhook = async () => {
    if (!formData.webhookUrl) {
      toast.error("Por favor seleccione una integración primero");
      return;
    }

    try {
      // Hacer el test a través del backend para evitar CORS
      const { data } = await api.post("/webhook-configs/test", {
        webhookUrl: formData.webhookUrl,
        customHeaders: formData.customHeaders,
        authType: formData.authType,
        authToken: formData.authToken
      });
      
      if (data.success) {
        toast.success("Webhook probado exitosamente");
      } else {
        toast.error(`Error al probar webhook: ${data.error}`);
      }
    } catch (error) {
      toast.error(`Error al probar webhook: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <MainContainer>
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <MainHeader>
        <Title>Configuración de Webhooks</Title>
        <MainHeaderButtonsWrapper>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleNewConfig}
          >
            Nueva Configuración
          </Button>
        </MainHeaderButtonsWrapper>
      </MainHeader>

      <Paper className={classes.mainPaper} variant="outlined">
        {configs.length === 0 ? (
          <Box textAlign="center" py={5}>
            <Typography variant="h6" color="textSecondary">
              No hay configuraciones de webhook
            </Typography>
            <Typography variant="body2" color="textSecondary" style={{ marginTop: 8 }}>
              Cree una nueva configuración para empezar a enviar webhooks
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNewConfig}
              style={{ marginTop: 16 }}
            >
              Crear Primera Configuración
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {configs.map((config) => (
              <Grid item xs={12} md={6} key={config.id}>
                <Card
                  className={`${classes.configCard} ${
                    config.isActive ? classes.activeCard : classes.inactiveCard
                  }`}
                >
                  <CardContent>
                    <div className={classes.cardHeader}>
                      <Box>
                        <Typography variant="h6">
                          {config.integration?.name || "Sin nombre"}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {config.webhookUrl}
                        </Typography>
                      </Box>
                      <Box>
                        <Switch
                          checked={config.isActive}
                          color="primary"
                          onClick={async () => {
                            try {
                              await api.put(`/webhook-configs/${config.id}`, {
                                isActive: !config.isActive,
                              });
                              loadData();
                            } catch (err) {
                              toastError(err);
                            }
                          }}
                        />
                        <IconButton size="small" onClick={() => handleEditConfig(config)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteConfig(config.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </div>

                    <Divider />

                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Condiciones activas:
                      </Typography>
                      {config.sendNewMessages && (
                        <Chip label="Mensajes nuevos" size="small" className={classes.chip} />
                      )}
                      {config.sendWithoutQueue && (
                        <Chip label="Sin cola" size="small" className={classes.chip} />
                      )}
                      {config.sendWithQueue && (
                        <Chip label="Con cola" size="small" className={classes.chip} />
                      )}
                      {config.sendWithAssignedUser && (
                        <Chip label="Con usuario" size="small" className={classes.chip} />
                      )}
                      {config.sendMediaMessages && (
                        <Chip label="Media" size="small" className={classes.chip} />
                      )}
                      {config.requireChatbot && (
                        <Chip
                          label="Requiere chatbot"
                          size="small"
                          color="secondary"
                          className={classes.chip}
                        />
                      )}
                      {config.requireIntegration && (
                        <Chip
                          label="Requiere integración"
                          size="small"
                          color="secondary"
                          className={classes.chip}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Dialog para crear/editar configuración */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedConfig ? "Editar Configuración" : "Nueva Configuración"}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="General" />
            <Tab label="Condiciones" />
            <Tab label="Filtros" />
            <Tab label="Autenticación" />
            <Tab label="Avanzado" />
          </Tabs>

          {/* Tab General */}
          <TabPanel value={tabValue} index={0}>
            <div className={classes.tabPanel}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Integración</InputLabel>
                <Select
                  value={formData.integrationId}
                  onChange={handleInputChange("integrationId")}
                  disabled={!!selectedConfig}
                >
                  {integrations.map((integration) => (
                    <MenuItem key={integration.id} value={integration.id}>
                      {integration.name} ({integration.type})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="URL del Webhook (configurado en la integración)"
                value={formData.webhookUrl}
                onChange={handleInputChange("webhookUrl")}
                disabled={true} // Siempre deshabilitado, viene de la integración
                helperText="El webhook URL se toma de la integración seleccionada"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon />
                    </InputAdornment>
                  ),
                }}
              />

              <Box mt={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={testWebhook}
                  disabled={!formData.webhookUrl}
                >
                  Probar Webhook
                </Button>
              </Box>
            </div>
          </TabPanel>

          {/* Tab Condiciones */}
          <TabPanel value={tabValue} index={1}>
            <div className={classes.tabPanel}>
              <Typography variant="subtitle1" className={classes.sectionTitle}>
                Tipos de Mensajes
                <Tooltip title="Seleccione qué tipos de mensajes enviar al webhook">
                  <HelpIcon className={classes.helpIcon} />
                </Tooltip>
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sendNewMessages}
                      onChange={handleInputChange("sendNewMessages")}
                    />
                  }
                  label="Enviar mensajes nuevos"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sendMediaMessages}
                      onChange={handleInputChange("sendMediaMessages")}
                    />
                  }
                  label="Enviar mensajes con media (imágenes, videos, etc.)"
                />
              </FormGroup>

              <Divider style={{ margin: "20px 0" }} />

              <Typography variant="subtitle1" className={classes.sectionTitle}>
                Estado del Ticket
                <Tooltip title="Configure según el estado del ticket">
                  <HelpIcon className={classes.helpIcon} />
                </Tooltip>
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sendWithoutQueue}
                      onChange={handleInputChange("sendWithoutQueue")}
                    />
                  }
                  label="Enviar tickets sin cola asignada"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sendWithQueue}
                      onChange={handleInputChange("sendWithQueue")}
                    />
                  }
                  label="Enviar tickets con cola asignada"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.sendWithAssignedUser}
                      onChange={handleInputChange("sendWithAssignedUser")}
                    />
                  }
                  label="Enviar tickets con usuario asignado"
                />
              </FormGroup>

              <Divider style={{ margin: "20px 0" }} />

              <Typography variant="subtitle1" className={classes.sectionTitle}>
                Requisitos Especiales
                <Tooltip title="Condiciones adicionales requeridas">
                  <HelpIcon className={classes.helpIcon} />
                </Tooltip>
              </Typography>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requireChatbot}
                      onChange={handleInputChange("requireChatbot")}
                    />
                  }
                  label="Requiere que el chatbot esté activo"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.requireIntegration}
                      onChange={handleInputChange("requireIntegration")}
                    />
                  }
                  label="Requiere que la integración esté activa"
                />
              </FormGroup>
            </div>
          </TabPanel>

          {/* Tab Filtros */}
          <TabPanel value={tabValue} index={2}>
            <div className={classes.tabPanel}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Enviar solo de estas colas</InputLabel>
                <Select
                  multiple
                  value={formData.sendOnlyFromQueues}
                  onChange={handleMultiSelectChange("sendOnlyFromQueues")}
                  renderValue={(selected) =>
                    selected
                      .map((id) => queues.find((q) => q.id === id)?.name)
                      .join(", ")
                  }
                >
                  {queues.map((queue) => (
                    <MenuItem key={queue.id} value={queue.id}>
                      <Checkbox
                        checked={formData.sendOnlyFromQueues.indexOf(queue.id) > -1}
                      />
                      {queue.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Enviar solo de estos WhatsApps</InputLabel>
                <Select
                  multiple
                  value={formData.sendOnlyFromWhatsapps}
                  onChange={handleMultiSelectChange("sendOnlyFromWhatsapps")}
                  renderValue={(selected) =>
                    selected
                      .map((id) => whatsapps.find((w) => w.id === id)?.name)
                      .join(", ")
                  }
                >
                  {whatsapps.map((whatsapp) => (
                    <MenuItem key={whatsapp.id} value={whatsapp.id}>
                      <Checkbox
                        checked={formData.sendOnlyFromWhatsapps.indexOf(whatsapp.id) > -1}
                      />
                      {whatsapp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </TabPanel>

          {/* Tab Autenticación */}
          <TabPanel value={tabValue} index={3}>
            <div className={classes.tabPanel}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo de Autenticación</InputLabel>
                <Select
                  value={formData.authType}
                  onChange={handleInputChange("authType")}
                >
                  <MenuItem value="none">Sin autenticación</MenuItem>
                  <MenuItem value="bearer">Bearer Token</MenuItem>
                  <MenuItem value="basic">Basic Auth</MenuItem>
                  <MenuItem value="apikey">API Key</MenuItem>
                </Select>
              </FormControl>

              {formData.authType !== "none" && (
                <TextField
                  fullWidth
                  margin="normal"
                  label={
                    formData.authType === "bearer"
                      ? "Bearer Token"
                      : formData.authType === "basic"
                      ? "Basic Auth (user:pass en base64)"
                      : "API Key"
                  }
                  type={showAuthToken ? "text" : "password"}
                  value={formData.authToken}
                  onChange={handleInputChange("authToken")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SecurityIcon />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowAuthToken(!showAuthToken)}
                          edge="end"
                        >
                          {showAuthToken ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <Divider style={{ margin: "20px 0" }} />

              <Typography variant="subtitle1" className={classes.sectionTitle}>
                Headers Personalizados
              </Typography>
              <Box display="flex" gap={1} mb={2}>
                <TextField
                  label="Nombre del Header"
                  value={customHeader.key}
                  onChange={(e) =>
                    setCustomHeader({ ...customHeader, key: e.target.value })
                  }
                />
                <TextField
                  label="Valor del Header"
                  value={customHeader.value}
                  onChange={(e) =>
                    setCustomHeader({ ...customHeader, value: e.target.value })
                  }
                />
                <Button
                  variant="outlined"
                  onClick={handleAddHeader}
                  disabled={!customHeader.key || !customHeader.value}
                >
                  Agregar
                </Button>
              </Box>
              {Object.entries(formData.customHeaders).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value}`}
                  onDelete={() => handleRemoveHeader(key)}
                  className={classes.chip}
                />
              ))}
            </div>
          </TabPanel>

          {/* Tab Avanzado */}
          <TabPanel value={tabValue} index={4}>
            <div className={classes.tabPanel}>
              <TextField
                fullWidth
                margin="normal"
                label="Intentos de reintento"
                type="number"
                value={formData.retryAttempts}
                onChange={handleInputChange("retryAttempts")}
                inputProps={{ min: 0, max: 10 }}
                helperText="Número de reintentos si falla el webhook"
              />

              <TextField
                fullWidth
                margin="normal"
                label="Delay entre reintentos (ms)"
                type="number"
                value={formData.retryDelay}
                onChange={handleInputChange("retryDelay")}
                inputProps={{ min: 100, max: 60000 }}
                helperText="Tiempo de espera entre reintentos"
              />

              <TextField
                fullWidth
                margin="normal"
                label="Timeout (ms)"
                type="number"
                value={formData.timeout}
                onChange={handleInputChange("timeout")}
                inputProps={{ min: 1000, max: 120000 }}
                helperText="Tiempo máximo de espera para la respuesta"
              />
            </div>
          </TabPanel>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            onClick={handleSaveConfig}
            color="primary"
            variant="contained"
            disabled={saving || !formData.integrationId || !formData.webhookUrl}
          >
            {saving ? <CircularProgress size={24} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </MainContainer>
  );
};

export default WebhookConfig;