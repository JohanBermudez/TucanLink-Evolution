import React, { useState, useContext, useEffect } from "react";
import clsx from "clsx";
import moment from "moment";
import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";

import { 
  Menu as MenuIcon, 
  ChevronLeft, 
  UserCircle, 
  RefreshCw,
  Globe2,
  Sun,
  Moon
} from "lucide-react";

import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import DarkMode from "../components/DarkMode";
import { i18n } from "../translate/i18n";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";

import logo from "../assets/logo.png";
import { SocketContext } from "../context/Socket/SocketContext";
import ChatPopover from "../pages/Chat/ChatPopover";

import { useDate } from "../hooks/useDate";

import ColorModeContext from "../layout/themeContext";
import LanguageControl from "../components/LanguageControl";

const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100vh",
    [theme.breakpoints.down("sm")]: {
      height: "calc(100vh - 56px)",
    },
    backgroundColor: theme.palette.fancyBackground,
    '& .MuiButton-outlinedPrimary': {
      color: theme.mode === 'light' ? '#FFF' : '#FFF',
	  //backgroundColor: theme.mode === 'light' ? '#682ee2' : '#682ee2',
	backgroundColor: theme.mode === 'light' ? theme.palette.primary.main : '#1c1c1c',
      //border: theme.mode === 'light' ? '1px solid rgba(0 124 102)' : '1px solid rgba(255, 255, 255, 0.5)',
    },
    '& .MuiTab-textColorPrimary.Mui-selected': {
      color: theme.mode === 'light' ? 'Primary' : '#FFF',
    }
  },
  avatar: {
    width: "100%",
  },
  toolbar: {
    paddingRight: 24,
    paddingLeft: 24,
    minHeight: 64,
    display: 'flex',
    alignItems: 'center',
    color: '#ffffff',
    background: theme.mode === 'light' 
      ? 'linear-gradient(135deg, #e83246 0%, #d62839 100%)'
      : 'linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    borderBottom: 'none',
    [theme.breakpoints.down("sm")]: {
      minHeight: 56,
      paddingLeft: 16,
      paddingRight: 16,
    }
  },
  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    minHeight: "64px",
    backgroundColor: theme.mode === 'light' ? '#ffffff' : '#1a1a1a',
    borderBottom: 'none',
    [theme.breakpoints.down("sm")]: {
      height: "56px"
    }
  },
  toolbarIconClosed: {
    justifyContent: "center",
    padding: "0 8px",
    borderBottom: 'none',
    '& img': {
      display: 'none',
    }
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    borderBottom: 'none',
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("sm")]: {
      display: "none"
    }
  },
  menuButton: {
    marginRight: 20,
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
  menuButtonHidden: {
    display: "none",
  },
  iconButton: {
    color: 'white',
    margin: '0 4px',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      transform: 'scale(1.05)',
    },
    transition: 'all 0.2s ease',
  },
  title: {
    flexGrow: 1,
    fontSize: 16,
    fontWeight: 500,
    color: "white",
    letterSpacing: '0.5px',
  },
  drawerPaper: {
    position: "relative",
    whiteSpace: "nowrap",
    width: drawerWidth,
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down("sm")]: {
      width: "100%"
    },
    backgroundColor: theme.mode === 'light' ? '#ffffff' : '#1a1a1a',
    borderRight: theme.mode === 'light' ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: theme.mode === 'light' ? '2px 0 10px rgba(0, 0, 0, 0.05)' : '2px 0 10px rgba(0, 0, 0, 0.3)',
    overflowX: 'hidden',
    overflowY: 'auto',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.mode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
      borderRadius: '3px',
      '&:hover': {
        background: theme.mode === 'light' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
      },
    },
    '&::-webkit-scrollbar-thumb:active': {
      background: theme.mode === 'light' ? 'rgba(232, 50, 70, 0.3)' : 'rgba(232, 50, 70, 0.4)',
    },
  },
  drawerPaperClose: {
    overflowX: "hidden",
    overflowY: "auto",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(8),
    [theme.breakpoints.up("sm")]: {
      width: theme.spacing(8),
    },
    [theme.breakpoints.down("sm")]: {
      width: "100%"
    },
    '& .MuiListItemIcon-root': {
      minWidth: 0,
      marginRight: 0,
      justifyContent: 'center',
      color: theme.mode === 'light' ? '#666' : '#aaa',
    },
    '& .MuiListItemText-root': {
      display: 'none',
    },
    '& .MuiListItem-root': {
      paddingLeft: 0,
      paddingRight: 0,
      justifyContent: 'center',
      margin: '4px 8px',
      borderRadius: '8px',
      minHeight: '48px',
    },
    '& .MuiListSubheader-root': {
      display: 'none',
    },
    '& .MuiDivider-root': {
      margin: '8px 12px',
      backgroundColor: theme.mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
    },
    '& .MuiCollapse-root': {
      display: 'none',
    },
    '& .MuiSvgIcon-root': {
      fontSize: '1.3rem',
    },
    '&::-webkit-scrollbar': {
      width: '0px',
    }
  },
  appBarSpacer: {
    minHeight: "48px",
  },
  content: {
    flex: 1,
    overflow: "auto",

  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column"
  },
  containerWithScroll: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  NotificationsPopOver: {
    // color: theme.barraSuperior.secondary.main,
  },
  logo: {
    width: "75%",
    height: "auto",
    maxWidth: 160,
    filter: theme.mode === 'light' ? 'none' : 'brightness(1.1)',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.05)'
    },
    [theme.breakpoints.down("sm")]: {
      width: "auto",
      height: "75%",
      maxWidth: 160,
    },
    logo: theme.logo
  },
}));

const LoggedInLayout = ({ children, themeToggle }) => {
  const classes = useStyles();
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  // const [dueDate, setDueDate] = useState("");
  const { user } = useContext(AuthContext);

  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);

  const { dateToClient } = useDate();

  // Languages
  const [anchorElLanguage, setAnchorElLanguage] = useState(null);
  const [menuLanguageOpen, setMenuLanguageOpen] = useState(false);


  //################### CODIGOS DE TESTE #########################################
  // useEffect(() => {
  //   navigator.getBattery().then((battery) => {
  //     console.log(`Battery Charging: ${battery.charging}`);
  //     console.log(`Battery Level: ${battery.level * 100}%`);
  //     console.log(`Charging Time: ${battery.chargingTime}`);
  //     console.log(`Discharging Time: ${battery.dischargingTime}`);
  //   })
  // }, []);

  // useEffect(() => {
  //   const geoLocation = navigator.geolocation

  //   geoLocation.getCurrentPosition((position) => {
  //     let lat = position.coords.latitude;
  //     let long = position.coords.longitude;

  //     console.log('latitude: ', lat)
  //     console.log('longitude: ', long)
  //   })
  // }, []);

  // useEffect(() => {
  //   const nucleos = window.navigator.hardwareConcurrency;

  //   console.log('Nucleos: ', nucleos)
  // }, []);

  // useEffect(() => {
  //   console.log('userAgent', navigator.userAgent)
  //   if (
  //     navigator.userAgent.match(/Android/i)
  //     || navigator.userAgent.match(/webOS/i)
  //     || navigator.userAgent.match(/iPhone/i)
  //     || navigator.userAgent.match(/iPad/i)
  //     || navigator.userAgent.match(/iPod/i)
  //     || navigator.userAgent.match(/BlackBerry/i)
  //     || navigator.userAgent.match(/Windows Phone/i)
  //   ) {
  //     console.log('é mobile ', true) //celular
  //   }
  //   else {
  //     console.log('não é mobile: ', false) //nao é celular
  //   }
  // }, []);
  //##############################################################################

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    if (document.body.offsetWidth > 1200) {
      setDrawerOpen(true);
    }
  }, []);

  useEffect(() => {
    if (document.body.offsetWidth < 600) {
      setDrawerVariant("temporary");
    } else {
      setDrawerVariant("permanent");
    }
  }, [drawerOpen]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const userId = localStorage.getItem("userId");

    const socket = socketManager.getSocket(companyId);

    socket.on(`company-${companyId}-auth`, (data) => {
      if (data.user.id === +userId) {
        toastError("Sua conta foi acessada em outro computador.");
        setTimeout(() => {
          localStorage.clear();
          window.location.reload();
        }, 1000);
      }
    });

    socket.emit("userStatus");
    const interval = setInterval(() => {
      socket.emit("userStatus");
    }, 1000 * 60 * 5);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [socketManager]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };

  const handlemenuLanguage = ( event ) => {
    setAnchorElLanguage(event.currentTarget);
    setMenuLanguageOpen( true );
  }

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };

  const handleCloseMenuLanguage = (  ) => {
    setAnchorElLanguage(null);
    setMenuLanguageOpen(false);
  }

  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseMenu();
  };

  const handleClickLogout = () => {
    handleCloseMenu();
    handleLogout();
  };

  const drawerClose = () => {
    if (document.body.offsetWidth < 600) {
      setDrawerOpen(false);
    }
  };

  const handleRefreshPage = () => {
    window.location.reload(false);
  }

  const handleMenuItemClick = () => {
    const { innerWidth: width } = window;
    if (width <= 600) {
      setDrawerOpen(false);
    }
  };

  const toggleColorMode = () => {
    colorMode.toggleColorMode();
  }

  if (loading) {
    return <BackdropLoading />;
  }

  return (
    <div className={classes.root}>
      <Drawer
        variant={drawerVariant}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        classes={{
          paper: clsx(
            classes.drawerPaper,
            !drawerOpen && classes.drawerPaperClose
          ),
        }}
        open={drawerOpen}
      >
        <div className={clsx(classes.toolbarIcon, !drawerOpen && classes.toolbarIconClosed)}>
          {drawerOpen && <img src={logo} className={classes.logo} alt="logo" />}
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
            <ChevronLeft size={24} />
          </IconButton>
        </div>
        {drawerOpen && <Divider />}
        <List className={classes.containerWithScroll}>
          <MainListItems drawerClose={drawerClose} collapsed={!drawerOpen} />
        </List>
        {drawerOpen && <Divider />}
      </Drawer>
      <UserModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={user?.id}
      />
      <AppBar
        position="absolute"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
        color="primary"
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          <IconButton
            edge="start"
            variant="contained"
            aria-label="open drawer"
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={clsx(
              classes.menuButton,
              drawerOpen && classes.menuButtonHidden
            )}
          >
            <MenuIcon size={24} style={{ color: "white" }} />
          </IconButton>

          <Typography
            component="h2"
            variant="h6"
            color="inherit"
            noWrap
            className={classes.title}
          >
            {/* {greaterThenSm && user?.profile === "admin" && getDateAndDifDays(user?.company?.dueDate).difData < 7 ? ( */}
            {greaterThenSm && user?.profile === "admin" && user?.company?.dueDate ? (
              <>
                {i18n.t("mainDrawer.appBar.greeting.hello")} <b>{user.name}</b>, {i18n.t("mainDrawer.appBar.greeting.welcome")} <b>{user?.company?.name}</b>! ({i18n.t("mainDrawer.appBar.greeting.active")} {dateToClient(user?.company?.dueDate)})
              </>
            ) : (
              <>
                {i18n.t("mainDrawer.appBar.greeting.hello")} <b>{user.name}</b>, {i18n.t("mainDrawer.appBar.greeting.welcome")} <b>{user?.company?.name}</b>!
              </>
            )}
          </Typography>
          
          <div>
            <IconButton edge="start" onClick={handlemenuLanguage}>
              <Globe2
                aria-label="language selector"
                aria-controls="menu-appbar-language"
                aria-haspopup="true"
                size={20}
                style={{ color: "white" }}
              />
            </IconButton>
            <Menu
              id="menu-appbar-language"
              anchorEl={anchorElLanguage}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={menuLanguageOpen}
              onClose={handleCloseMenuLanguage}
            >
              <MenuItem>
                <LanguageControl />
              </MenuItem>
            </Menu>
          </div>          

          <IconButton edge="start" onClick={toggleColorMode}>
            {theme.mode === 'dark' ? <Sun size={20} style={{ color: "white" }} /> : <Moon size={20} style={{ color: "white" }} />}
          </IconButton>

          <NotificationsVolume
            setVolume={setVolume}
            volume={volume}
          />

          <IconButton
            onClick={handleRefreshPage}
            aria-label={i18n.t("mainDrawer.appBar.refresh")}
            color="inherit"
            style={{ 
              color: "white",
              transition: 'all 0.3s ease',
            }}
            className={classes.iconButton}
          >
            <RefreshCw size={20} />
          </IconButton>

          {user.id && <NotificationsPopOver volume={volume} />}

          <AnnouncementsPopover />

          <ChatPopover />

          <div>
            <IconButton
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              variant="contained"
              className={classes.iconButton}
            >
              <UserCircle size={22} />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
              open={menuOpen}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUserModal}>
                {i18n.t("mainDrawer.appBar.user.profile")}
              </MenuItem>
              <MenuItem onClick={handleClickLogout}>
                {i18n.t("mainDrawer.appBar.user.logout")}
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <main className={classes.content}>
        <div className={classes.appBarSpacer} />

        {children ? children : null}
      </main>
    </div>
  );
};

export default LoggedInLayout;
