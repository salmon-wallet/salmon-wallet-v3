/**
 * Custom styled wrapper that automatically filters transient `$` props
 * from being forwarded to the DOM.
 *
 * Drop-in replacement for `import { styled } from '@mui/material/styles'`.
 * Supports custom `shouldForwardProp` overrides — when provided, both
 * the `$` filter and the custom filter must pass for a prop to be forwarded.
 */
import { styled as muiStyled } from '@mui/material/styles';

type StyledParams = Parameters<typeof muiStyled>;

export const styled = ((component: StyledParams[0], options?: StyledParams[1]) => {
  const customShouldForward = options?.shouldForwardProp;

  return muiStyled(component, {
    ...options,
    shouldForwardProp: (prop: string) => {
      if (prop.startsWith('$')) return false;
      return customShouldForward ? customShouldForward(prop) : true;
    },
  });
}) as typeof muiStyled;
