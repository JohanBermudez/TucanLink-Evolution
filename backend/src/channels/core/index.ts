// Core Channel System Exports
export { default as ChannelManagerInterface } from "./ChannelManagerInterface";
export { default as BaseChannelProvider } from "./BaseChannelProvider";

// Re-export interfaces and types
export * from "./ChannelManagerInterface";
export * from "./BaseChannelProvider";

// Core functionality
import ChannelManagerInterface from "./ChannelManagerInterface";
import BaseChannelProvider from "./BaseChannelProvider";

export const ChannelCore = {
  ChannelManagerInterface,
  BaseChannelProvider
};

export default ChannelCore;