import { createContext } from "react";
import openSocket from "socket.io-client";
import jwt from "jsonwebtoken";

class ManagedSocket {
  constructor(socketManager) {
    this.socketManager = socketManager;
    this.rawSocket = socketManager.currentSocket;
    this.callbacks = [];
    this.joins = [];

    this.rawSocket.on("connect", () => {
      if (!this.rawSocket.recovered) {
        const refreshJoinsOnReady = () => {
          for (const j of this.joins) {
            console.debug("refreshing join", j);
            this.rawSocket.emit(`join${j.event}`, ...j.params);
          }
          this.rawSocket.off("ready", refreshJoinsOnReady);
        };
        for (const j of this.callbacks) {
          this.rawSocket.off(j.event, j.callback);
          this.rawSocket.on(j.event, j.callback);
        }
        
        this.rawSocket.on("ready", refreshJoinsOnReady);
      }
    });
  }
  
  on(event, callback) {
    if (event === "ready" || event === "connect") {
      return this.socketManager.onReady(callback);
    }
    this.callbacks.push({event, callback});
    return this.rawSocket.on(event, callback);
  }
  
  off(event, callback) {
    const i = this.callbacks.findIndex((c) => c.event === event && c.callback === callback);
    this.callbacks.splice(i, 1);
    return this.rawSocket.off(event, callback);
  }
  
  emit(event, ...params) {
    if (event.startsWith("join")) {
      this.joins.push({ event: event.substring(4), params });
      console.log("Joining", { event: event.substring(4), params});
    }
    return this.rawSocket.emit(event, ...params);
  }
  
  disconnect() {
    for (const j of this.joins) {
      this.rawSocket.emit(`leave${j.event}`, ...j.params);
    }
    this.joins = [];
    for (const c of this.callbacks) {
      this.rawSocket.off(c.event, c.callback);
    }
    this.callbacks = [];
  }
}

class DummySocket {
  on(..._) {}
  off(..._) {}
  emit(..._) {}
  disconnect() {}
}

const SocketManager = {
  currentCompanyId: -1,
  currentUserId: -1,
  currentSocket: null,
  socketReady: false,

  getSocket: function(companyId) {
    let userId = null;
    if (localStorage.getItem("userId")) {
      userId = localStorage.getItem("userId");
    }

    if (!companyId && !this.currentSocket) {
      return new DummySocket();
    }

    if (companyId && typeof companyId !== "string") {
      companyId = `${companyId}`;
    }

    if (companyId !== this.currentCompanyId || userId !== this.currentUserId) {
      if (this.currentSocket) {
        console.warn("closing old socket - company or user changed");
        this.currentSocket.removeAllListeners();
        this.currentSocket.disconnect();
        this.currentSocket = null;
      }

      let token = JSON.parse(localStorage.getItem("token"));
      const { exp } = jwt.decode(token) ?? {};

      if ( Date.now() >= exp*1000) {
        console.warn("Expired token, reload after refresh");
        setTimeout(() => {
          window.location.reload();
        },1000);
        return new DummySocket();
      }

      this.currentCompanyId = companyId;
      this.currentUserId = userId;
      
      if (!token) {
        return new DummySocket();
      }
      
      // Socket.io needs to connect to the base URL, not the /api path
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';
      
      // Extract the base URL without /api path
      let socketUrl;
      if (backendUrl.includes('/api')) {
        // For production: https://domain.com/api -> https://domain.com
        socketUrl = backendUrl.substring(0, backendUrl.indexOf('/api'));
      } else {
        // For local development: http://localhost:8080
        socketUrl = backendUrl;
      }
      
      console.log("🔌 Socket.io initialization:", {
        backendUrl,
        socketUrl,
        hasToken: !!token,
        companyId,
        userId
      });
      
      // Force connection to root namespace without any path confusion
      this.currentSocket = openSocket(socketUrl, {
        transports: ["polling", "websocket"], // Allow both transports for fallback
        pingTimeout: 18000,
        pingInterval: 18000,
        query: { token }
        // Removed path to let Socket.io handle it automatically
      });
      
      console.log("🔌 Socket created:", this.currentSocket);
      
      this.currentSocket.on("disconnect", (reason) => {
        console.warn(`socket disconnected because: ${reason}`);
        if (reason.startsWith("io ")) {
          console.warn("tryng to reconnect", this.currentSocket);
          
          const { exp } = jwt.decode(token);
          if ( Date.now()-180 >= exp*1000) {
            console.warn("Expired token, reloading app");
            window.location.reload();
            return;
          }

          this.currentSocket.connect();
        }        
      });
      
      this.currentSocket.on("connect", (...params) => {
        console.warn("✅ Socket.io CONNECTED!", {
          id: this.currentSocket.id,
          connected: this.currentSocket.connected,
          params
        });
      });
      
      this.currentSocket.on("connect_error", (error) => {
        console.error("❌ Socket.io connection error:", {
          message: error.message,
          type: error.type,
          data: error.data
        });
      });
      
      this.currentSocket.onAny((event, ...args) => {
        console.debug("📨 Socket.io Event: ", { socket: this.currentSocket, event, args });
      });
      
      this.onReady(() => {
        this.socketReady = true;
      });

    }
    
    return new ManagedSocket(this);
  },
  
  onReady: function( callbackReady ) {
    if (this.socketReady) {
      callbackReady();
      return
    }
    
    this.currentSocket.once("ready", () => {
      callbackReady();
    });
  },

};

const SocketContext = createContext()

export { SocketContext, SocketManager };
