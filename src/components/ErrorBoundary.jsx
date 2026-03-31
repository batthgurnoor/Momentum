import React from 'react';
import { ScrollView, Text, View } from 'react-native';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
    // Keep console.error for logcat visibility in release builds.
    // eslint-disable-next-line no-console
    console.error('Uncaught render error:', error, errorInfo);
  }

  render() {
    const { error, errorInfo } = this.state;
    if (!error) return this.props.children;

    const title = this.props.title ?? 'Something went wrong';
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: '#0b0f19' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
          {title}
        </Text>
        <Text style={{ color: '#cbd5e1', marginBottom: 12 }}>
          A screen crashed while rendering. The error is shown below.
        </Text>
        <ScrollView
          style={{ flex: 1, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)' }}
          contentContainerStyle={{ padding: 12 }}
        >
          <Text style={{ color: '#fecaca', fontFamily: 'monospace' }}>
            {String(error?.message ?? error)}
          </Text>
          {errorInfo?.componentStack ? (
            <Text style={{ color: '#e2e8f0', marginTop: 12, fontFamily: 'monospace' }}>
              {String(errorInfo.componentStack)}
            </Text>
          ) : null}
        </ScrollView>
      </View>
    );
  }
}

