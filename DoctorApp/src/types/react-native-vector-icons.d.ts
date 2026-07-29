declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { IconProps } from 'react-native-vector-icons/Icon';
  export default class Ionicons extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/Icon' {
  import { Component } from 'react';
  import { TextStyle, ViewStyle, StyleProp } from 'react-native';
  export interface IconProps {
    name: string;
    size?: number;
    color?: string;
    style?: StyleProp<TextStyle>;
  }
  export default class Icon extends Component<IconProps> {}
}
