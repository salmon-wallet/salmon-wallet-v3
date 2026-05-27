declare module '*.ttf' {
  const content: number;
  export default content;
}

declare module '*.otf' {
  const content: number;
  export default content;
}

declare module '*.png' {
  const content: number;
  export default content;
}

declare module '*.jpg' {
  const content: number;
  export default content;
}

declare module '*.jpeg' {
  const content: number;
  export default content;
}

declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.gif' {
  const content: number;
  export default content;
}

declare module '*.webp' {
  const content: number;
  export default content;
}
