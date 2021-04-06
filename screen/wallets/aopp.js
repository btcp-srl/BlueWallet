import React, { useEffect, useState, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator, Alert, FlatList, StyleSheet, View } from 'react-native';
import { useRoute, useTheme, useNavigation } from '@react-navigation/native';
import { Badge, ListItem } from 'react-native-elements';

import { BlueStorageContext } from '../../blue_modules/storage-context';
import { SafeBlueArea } from '../../BlueComponents';
import navigationStyle from '../../components/navigationStyle';
import loc from '../../loc';
import AOPPClient from '../../class/aopp';

const ChangeBadge = () => {
  const { colors } = useTheme();
  const oStyles = StyleSheet.create({
    change: { backgroundColor: colors.buttonDisabledBackgroundColor, borderWidth: 0 },
    changeText: { color: colors.alternativeTextColor },
  });
  return <Badge value={loc.cc.change} badgeStyle={oStyles.change} textStyle={oStyles.changeText} />;
};

const Address = ({ address, change, onPress }) => {
  const { colors } = useTheme();

  const oStyles = StyleSheet.create({
    container: { borderBottomColor: colors.lightBorder, backgroundColor: colors.elevated },
    address: { fontSize: 14, color: colors.foregroundColor },
  });

  return (
    <ListItem bottomDivider onPress={onPress} containerStyle={oStyles.container}>
      <ListItem.Content>
        <ListItem.Title style={oStyles.address} numberOfLines={1}>
          {address}
        </ListItem.Title>
      </ListItem.Content>
      {change && <ChangeBadge />}
    </ListItem>
  );
};

Address.propTypes = {
  address: PropTypes.string.isRequired,
  change: PropTypes.bool,
  onPress: PropTypes.func,
};

const AOPP = () => {
  const [walletID, setWalletID] = useState();
  const [aopp, setAopp] = useState();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { uri } = useRoute().params;
  const { wallets } = useContext(BlueStorageContext);

  const { wallet, addresses } = useMemo(() => {
    if (!walletID) return { wallet: null, addresses: [] };
    const wallet = wallets.find(w => w.getID() === walletID);
    const addresses = [];

    for (let c = 0; c < wallet.next_free_address_index + wallet.gap_limit; c++) {
      addresses.push({ address: wallet._getExternalAddressByIndex(c), change: false });
    }
    for (let c = 0; c < wallet.next_free_change_address_index + wallet.gap_limit; c++) {
      addresses.push({ address: wallet._getInternalAddressByIndex(c), change: true });
    }
    return { wallet, addresses };
  }, [walletID]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let aoppNew;
    try {
      aoppNew = new AOPPClient(uri);
    } catch (e) {
      Alert.alert(e.message);
    }

    let availableWallets = wallets.filter(w => w.allowSignVerifyMessage());
    if (aoppNew.format !== 'any') {
      let segwitType;
      switch (aoppNew.format) {
        case 'p2wpkh':
          segwitType = 'p2wpkh';
          break;
        case 'p2sh':
          segwitType = 'p2sh(p2wpkh)';
          break;
        case 'p2pkh':
          segwitType = undefined;
          break;
      }
      availableWallets = availableWallets.filter(w => w.segwitType === segwitType);
    }

    setAopp(aoppNew);

    navigation.navigate('SelectWallet', {
      onWalletSelect: wallet => {
        setWalletID(wallet.getID());
        navigation.pop();
      },
      availableWallets,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChoose = address =>
    navigation.navigate('SignVerify', {
      walletID,
      address,
      message: aopp.msg,
      aoppURI: uri,
    });

  const renderItem = p => {
    const { address, change } = p.item;
    return <Address address={address} change={change} onPress={() => handleChoose(address)} />;
  };

  if (!wallet) {
    return (
      <SafeBlueArea style={[styles.center, { backgroundColor: colors.elevated }]}>
        <ActivityIndicator />
      </SafeBlueArea>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.elevated }]}>
      <FlatList data={addresses} renderItem={renderItem} keyExtractor={item => item.address} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

AOPP.navigationOptions = navigationStyle({}, opts => ({ ...opts, title: loc.aopp.title }));

export default AOPP;
