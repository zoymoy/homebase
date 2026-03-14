import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  window: { width, height },
  padding: 16,
  borderRadius: 12,
  borderRadiusSmall: 8,
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
};
