// Web version: react-content-loader (CSS-based SVG animations)
// On web, Rect and Circle are standard SVG elements, not react-native-svg components.
//
// TypeScript resolves this file (.ts) even when building for native, so types
// must be compatible with props used in the native code (e.g. accessibilityLabel
// from SvgProps). We use Record<string, unknown> intersection to accept those.
import React from 'react';
import BaseContentLoader from 'react-content-loader';
import type { IContentLoaderProps } from 'react-content-loader';

type ContentLoaderProps = IContentLoaderProps & Record<string, unknown>;

const ContentLoader = BaseContentLoader as React.ComponentType<ContentLoaderProps>;

export { ContentLoader };

// Thin wrappers that map uppercase component names (used by code written for
// react-content-loader/native) to their lowercase SVG element equivalents.
export const Rect: React.FC<Record<string, unknown>> = (props) =>
  React.createElement('rect', props);

export const Circle: React.FC<Record<string, unknown>> = (props) =>
  React.createElement('circle', props);
