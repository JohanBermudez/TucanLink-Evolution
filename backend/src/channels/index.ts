// Main Channel System Export
export { default as ChannelManager } from "./services/ChannelManager";

// Models
export * from "./models";
export { default as ChannelModels } from "./models";

// Core interfaces and base classes
export * from "./core";
export { default as ChannelCore } from "./core";

// Providers
export { default as WhatsAppBaseProvider } from "./providers/base/WhatsAppBaseProvider";
export { default as WhatsAppCloudProvider } from "./providers/whatsapp/WhatsAppCloudProvider";

// Services
export { default as ChannelManagerService } from "./services/ChannelManager";

// Main export for easy integration
import ChannelManager from "./services/ChannelManager";
import WhatsAppCloudProvider from "./providers/whatsapp/WhatsAppCloudProvider";
import { ChannelType } from "./models/Channel";

export const ChannelSystem = {
  ChannelManager,
  Providers: {
    WhatsAppCloudProvider
  },
  Types: {
    ChannelType
  }
};

export default ChannelSystem;