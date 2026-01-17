import React from 'react';
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
// Import custom components
import FnRef, { FnInfo } from '@site/src/components/FnRef';
import ImplLink from '@site/src/components/ImplLink';
import ImplRef from '@site/src/components/ImplRef';
import FunctionTag from '@site/src/components/FunctionTag';

export default {
  // Re-use the default mapping
  ...MDXComponents,
  // Add custom components available globally in MDX
  FnRef,
  FnInfo,
  ImplLink,
  ImplRef,
  FunctionTag,
};
