import React from 'react';
import LottieView from 'lottie-react-native';
import * as NavigationService from './NavigationService';
import { StackActions } from '@react-navigation/native';
import {Image, Text, View} from "react-native";

const LoadingScreen = () => {
  const replaceStackNavigation = () => {
    NavigationService.dispatch(StackActions.replace('UnlockWithScreenRoot'));
  };

  setTimeout(() => {
    console.log("Loaded")
    replaceStackNavigation();
  }, 1000)

  return <View style={{flex:1, justifyContent: "center", alignItems: "center"}}>
    <Image source={require('./img/splash/splash.png')}/>
  </View>;
};
export default LoadingScreen;
