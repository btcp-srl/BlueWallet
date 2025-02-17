import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {StatusBar, Linking, Platform, Alert} from 'react-native';
import { WebView } from 'react-native-webview';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import Toast from "react-native-toast-message"
import { BlueLoading, SafeBlueArea } from '../../BlueComponents';
import navigationStyle from '../../components/navigationStyle';
import { LightningCustodianWallet, WatchOnlyWallet } from '../../class';
import * as NavigationService from '../../NavigationService';
import { BlueStorageContext } from '../../blue_modules/storage-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {navigate} from "../../NavigationService";
const currency = require('../../blue_modules/currency');

export default class BuyBitcoin extends Component {
  static contextType = BlueStorageContext;
  constructor(props) {
    super(props);
    const wallet = props.route.params.wallet;
    if (!wallet) console.warn('wallet was not passed to buyBitcoin');

    this.state = {
      isLoading: true,
      wallet,
      uri: '',
    };
  }

  static async generateURL(wallet) {
    let preferredCurrency = await currency.getPreferredCurrency();
    preferredCurrency = preferredCurrency.endPointKey;

    /**  @type {AbstractHDWallet|WatchOnlyWallet|LightningCustodianWallet}   */

    let address = '';

    if (WatchOnlyWallet.type === wallet.type && !wallet.isHd()) {
      // plain watchonly - just get the address
      address = wallet.getAddress();
    } else {
      // otherwise, lets call widely-used getAddressAsync()
      try {
        address = await Promise.race([wallet.getAddressAsync(), new Promise(resolve => setTimeout(resolve, 2000))]);
      } catch (_) {}

      if (!address) {
        // either sleep expired or getAddressAsync threw an exception
        if (LightningCustodianWallet.type === wallet.type) {
          // not much we can do, lets hope refill address was cached previously
          address = wallet.getAddress() || '';
        } else {
          // plain hd wallet (either HD or watchonly-wrapped). trying next free address
          address = wallet._getExternalAddressByIndex(wallet.getNextFreeAddressIndex());
        }
      }
    }

    //todo frontend buy call with precompiled address given from url
    let uri = 'https://bitmoon.bitcoinpeople.it/main/purchase?address=' + address;
    console.log("buy_btc", uri)
    return uri;
  }

  async componentDidMount() {
    console.log('buyBitcoin - componentDidMount');

    if((await AsyncStorage.getItem("BITMOON_LOGIN")) !== "true")
      Alert.alert(
          "Utente non loggato",
          "Non hai effettuato l'accesso a Bitmoon! per continuare alla pagina di login fare tap su `Procedi`; per salvare le proprie credenziali internamente all'app premere su `Registra`",
          [
            {
              text: "Registra",
              onPress: () => navigate("BitmoonLogin"),
              style: "cancel"
            },
            { text: "Procedi", onPress: () => {} }
          ]
      );

    console.log(await AsyncStorage.getItem("BITMOON_TOKEN"))

    let uri = await BuyBitcoin.generateURL(this.state.wallet);
    this.setState({ uri, isLoading: false });
  }

  render() {
    if (this.state.isLoading) {
      return <BlueLoading />;
    }

    return (
      <SafeBlueArea>
        <StatusBar barStyle="default" />
        <WebView
          source={{
            uri: this.state.uri,
          }}
        />
      </SafeBlueArea>
    );
  }
}

BuyBitcoin.propTypes = {
  route: PropTypes.shape({
    name: PropTypes.string,
    params: PropTypes.shape({
      wallet: PropTypes.object.isRequired,
      safelloStateToken: PropTypes.string,
    }),
  }),
};

BuyBitcoin.navigationOptions = navigationStyle({
  closeButton: true,
  title: '',
  headerLeft: null,
});

BuyBitcoin.navigate = async wallet => {
  const uri = await BuyBitcoin.generateURL(wallet);
  if (Platform.OS === 'ios') {
    InAppBrowser.isAvailable()
      .then(_value => {
        InAppBrowser.open(uri, { dismissButtonStyle: 'done', modalEnabled: true, animated: true });
      })
      .catch(error => {
        console.log(error);
        Linking.openURL(uri);
      });
  } else {
    NavigationService.navigate('BuyBitcoin', {
      wallet,
    });
  }
};
