import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import DirectionType from './DirectionType'

class Button extends React.PureComponent {
  render() {
    const size = 50 - 4
    const {style, onPress, id, onPressOut} = this.props
    return (
      <TouchableOpacity style={[style, {padding: 2}]} onPressOut={ () => onPressOut(id)} onPressIn={ () => {onPress(id)}}>
        <View style={{width: size, height: size, backgroundColor: 'rgba(200, 200, 200, 0.7)', borderRadius: 3}}>
        </View>
      </TouchableOpacity>
    )
  }
}

export default class DPad extends React.Component {
  render() {
    const {onPress, onPressOut, style} = this.props
    return (
      <View pointerEvents={'box-none'} style={[styles.container, style]}>
        <View pointerEvents={'box-none'} style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Button onPressOut={onPressOut} onPress={onPress} id={DirectionType.up}
          />
        </View>
        <View pointerEvents={'box-none'} style={{flexDirection: 'row'}}>
          <Button onPressOut={onPressOut} onPress={onPress} id={DirectionType.left}
          />
        <Button onPressOut={onPressOut} onPress={onPress} id={null}
          />
        <Button onPressOut={onPressOut} onPress={onPress} id={DirectionType.right}
          />
        </View>
        <View pointerEvents={'box-none'} style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Button onPressOut={onPressOut} onPress={onPress} id={DirectionType.down}
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    height: 50 * 3,
    width: 50 * 3
  }
});
