import React, { useContext, useEffect, useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, useColorScheme } from 'react-native';
import { Icon } from 'react-native-elements';
import Biometric from './class/biometrics';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackActions, useNavigation, useRoute } from '@react-navigation/native';
import { BlueStorageContext } from './blue_modules/storage-context';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
/** @type {AppStorage} */

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  biometric: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 58,
  },
  biometricRow: {
    justifyContent: 'center',
    flexDirection: 'row',
  },
  icon: {
    width: 64,
    height: 64,
  },
  encrypted: {
    width: 0.5,
    height: 20,
  },
});

const UnlockWith = () => {
  const { setWalletsInitialized, isStorageEncrypted, startAndDecrypt } = useContext(BlueStorageContext);
  const { dispatch } = useNavigation();
  const { unlockOnComponentMount } = useRoute().params;
  const [biometricType, setBiometricType] = useState(false);
  const [isStorageEncryptedEnabled, setIsStorageEncryptedEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const colorScheme = useColorScheme();

  const initialRender = async () => {
    let biometricType = false;
    if (await Biometric.isBiometricUseCapableAndEnabled()) {
      biometricType = await Biometric.biometricType();
    }
    const storageIsEncrypted = await isStorageEncrypted();
    setIsStorageEncryptedEnabled(storageIsEncrypted);
    setBiometricType(biometricType);
    if (unlockOnComponentMount) {
      if (!biometricType || storageIsEncrypted) {
        unlockWithKey();
      } else if (typeof biometricType === 'string') unlockWithBiometrics();
    }
  };

  useEffect(() => {
    initialRender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const successfullyAuthenticated = () => {
    setWalletsInitialized(true);
    dispatch(StackActions.replace('DrawerRoot'));
  };

  const unlockWithBiometrics = async () => {
    if (await isStorageEncrypted()) {
      unlockWithKey();
    }
    setIsAuthenticating(true);

    if (await Biometric.unlockWithBiometrics()) {
      setIsAuthenticating(false);
      await startAndDecrypt();
      ReactNativeHapticFeedback.trigger('notificationSuccess', { ignoreAndroidSystemSettings: false });
      return successfullyAuthenticated();
    }
    setIsAuthenticating(false);
  };

  const unlockWithKey = async () => {
    setIsAuthenticating(true);
    if (await startAndDecrypt()) {
      ReactNativeHapticFeedback.trigger('notificationSuccess', { ignoreAndroidSystemSettings: false });
      successfullyAuthenticated();
    } else {
      setIsAuthenticating(false);
    }
  };

  const renderUnlockOptions = () => {
    if (isAuthenticating) {
      return <ActivityIndicator />;
    } else {
      const color = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
      if ((biometricType === Biometric.TouchID || biometricType === Biometric.Biometrics) && !isStorageEncryptedEnabled) {
        return (
          <TouchableOpacity disabled={isAuthenticating} onPress={unlockWithBiometrics}>
            <Icon name="fingerprint" size={64} type="font-awesome5" color={color} />
          </TouchableOpacity>
        );
      } else if (biometricType === Biometric.FaceID && !isStorageEncryptedEnabled) {
        return (
          <TouchableOpacity disabled={isAuthenticating} onPress={unlockWithBiometrics}>
            <Image
              source={colorScheme === 'dark' ? require('./img/faceid-default.png') : require('./img/faceid-dark.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        );
      } else if (isStorageEncryptedEnabled) {
        return (
          <TouchableOpacity disabled={isAuthenticating} onPress={unlockWithKey}>
            <Icon name="lock" size={64} type="font-awesome5" color={color} />
          </TouchableOpacity>
        );
      }
    }
  };

  if (!biometricType && !isStorageEncryptedEnabled) {
    return <View />;
  } else {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="default" />
        <View style={styles.container}>
          {/*<LottieView source={require('./img/bluewalletsplash.json')} progress={1} loop={false} />
             <Image source={require('./img/splash/splash.png')}/>*/}
          <View style={styles.biometric}>
            <View style={styles.biometricRow}>{renderUnlockOptions()}</View>
          </View>
        </View>
      </SafeAreaView>
    );
  }
};

export default UnlockWith;
