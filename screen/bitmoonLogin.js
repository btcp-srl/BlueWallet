/* eslint-disable react/prop-types */
import React, {useState} from 'react';
import {Alert, Button, I18nManager, StatusBar, StyleSheet, TextInput} from 'react-native';

import {SafeBlueArea} from '../BlueComponents';
import navigationStyle from '../components/navigationStyle';
import {useTheme} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BitmoonLogin = () => {
    const { colors } = useTheme();
    const [isLogged, setIsLogged] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [loginText, setloginText] = useState("Login")
    const [username, onChangeUsername] = useState("");
    const [password, onChangePassword] = useState("");
    const styles = StyleSheet.create({
        loading: {
            flex: 1,
            justifyContent: 'center',
            alignContent: 'center',
            paddingTop: 20,
            backgroundColor: colors.background,
        },
        itemRoot: {
            backgroundColor: 'transparent',
            padding: 10,
            marginVertical: 17,
        },
        gradient: {
            padding: 15,
            borderRadius: 10,
            minHeight: 164,
            elevation: 5,
        },
        image: {
            width: 99,
            height: 94,
            position: 'absolute',
            bottom: 0,
            right: 0,
        },
        transparentText: {
            backgroundColor: 'transparent',
        },
        label: {
            backgroundColor: 'transparent',
            fontSize: 19,
            color: '#fff',
            writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },

        balance: {
            backgroundColor: 'transparent',
            fontWeight: 'bold',
            fontSize: 36,
            writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',

            color: '#fff',
        },
        latestTxLabel: {
            backgroundColor: 'transparent',
            fontSize: 13,
            color: '#fff',
            writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
        },
        latestTxValue: {
            backgroundColor: 'transparent',
            fontWeight: 'bold',
            fontSize: 16,
            writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',

            color: '#fff',
        },
        noWallets: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: 20,
        },
        center: {
            textAlign: 'center',
        },
    });

    AsyncStorage.getItem("BITMOON_LOGIN").then(r => setIsLogged(r === "true"))

    return (
        <SafeBlueArea>
            <StatusBar barStyle="light-content"/>
            {isLogged && <Button title={"Logout"} onPress={() => {
                AsyncStorage.removeItem("BITMOON_TOKEN");
                AsyncStorage.setItem("BITMOON_LOGIN", "false");
                setIsLogged(false)
            }}/>}
            {!isLogged && <>
                <TextInput onChangeText={onChangeUsername} placeholder={"Email"}/>
                <TextInput secureTextEntry={true} onChangeText={onChangePassword} placeholder={"Password"}/>
                <Button disabled={isLoading} title={loginText} onPress={() => {

                    setIsLoading(true)
                    setloginText("Logging in...")

                    console.log(JSON.stringify({email: username, password: password}));

                    fetch("https://bitmoon.bitcoinpeople.it/api/user/actions/login/", {
                        method: "POST",
                        body: JSON.stringify({email: username, password: password, duration: 87600}),
                        headers: {"Content-Type": "application/json"}
                    }).then(res => res.json()).then(r => {
                        console.log(r)
                        if(r.status){
                            AsyncStorage.setItem("BITMOON_LOGIN", "true");
                            AsyncStorage.setItem("BITMOON_TOKEN", r.token);
                            setIsLogged(true)
                        } else {
                            setIsLoading(false)
                            setloginText("Login")
                            Alert.alert("Errore nel login", r.ecode + ": " + r.message, [{text: "OK"}])
                        }
                    }).catch(e => {
                        setIsLoading(false)
                        setloginText("Login")
                        Alert.alert("Errore nel login", "Errore nel login. riprovare più tardi", [{text: "OK"}])
                    })
                }}/>
            </>}
        </SafeBlueArea>
    );
}

BitmoonLogin.navigationOptions = navigationStyle({closeButton: true}, opts => ({...opts, title: "Bitmoon Login"}));

export default BitmoonLogin;
