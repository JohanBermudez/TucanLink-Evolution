// Channel Models Export
export { default as Channel, ChannelType, ChannelStatus } from "./Channel";
export { default as ChannelConnection, ConnectionStatus } from "./ChannelConnection";
export { default as ChannelMessage, MessageDirection, MessageStatus, ProcessingStatus } from "./ChannelMessage";
export { default as ChannelTemplate, TemplateCategory, TemplateStatus, QualityRating } from "./ChannelTemplate";
export { default as ChannelWebhook } from "./ChannelWebhook";

// Re-export all models for easy import
import Channel from "./Channel";
import ChannelConnection from "./ChannelConnection";
import ChannelMessage from "./ChannelMessage";
import ChannelTemplate from "./ChannelTemplate";
import ChannelWebhook from "./ChannelWebhook";

export const ChannelModels = {
  Channel,
  ChannelConnection,
  ChannelMessage,
  ChannelTemplate,
  ChannelWebhook
};

export default ChannelModels;