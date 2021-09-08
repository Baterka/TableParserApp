import React, {useEffect, useState} from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View,
    Text, Button, Alert, ActivityIndicator,
} from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import XLSX from 'xlsx';
import RNFetchBlob from "rn-fetch-blob";
import {Table, Td, Tr} from "./components/CustomTable";

enum AuthState {
    PENDING = "PENDING",
    NOT_SUPPORTED = "NOT_SUPPORTED",
    AUTHENTICATED = "AUTHENTICATED",
    UNAUTHENTICATED = "UNAUTHENTICATED"
}

const App = () => {
    const [authenticated, setAuthenticated] = useState<AuthState>(AuthState.PENDING);
    const [tableData, setTableData] = useState<{
        [key: string]: {
            widthArr: number[],
            rows: (string | number)[][]
        }
    }>({});
    const [loading, setLoading] = useState<boolean>(false);

    /**
     * Checks if biometry is available
     */
    const isBiometryAvailable = async (): Promise<boolean> => {
        try {
            const {biometryType, available} = await ReactNativeBiometrics.isSensorAvailable();

            console.log(`Biometry check | Available: ${available} Type: ${biometryType}`);

            return available;
        } catch (err) {
            console.warn("Biometry check failed: ", err)
            return false;
        }
    };

    /**
     * Prompts biometry authentication
     */
    const promptBiometry = async (): Promise<boolean> => {
        try {
            const {success} = await ReactNativeBiometrics.simplePrompt({promptMessage: 'Confirm fingerprint'})
            return success;
        } catch (err) {
            console.warn("Biometry prompt failed: ", err)
            return false;
        }
    }

    /**
     * Try to authenticate by biometry
     */
    const tryToAuthenticate = async (): Promise<void> => {
        if (await isBiometryAvailable()) {
            setAuthenticated(await promptBiometry() ? AuthState.AUTHENTICATED : AuthState.UNAUTHENTICATED);
        } else
            setAuthenticated(AuthState.NOT_SUPPORTED)
    }

    /**
     * Finds longest cell in column and adapts width of this column.
     * Ensures that the field always fits in the cell (in most cases :P)
     * @param rows
     */
    const computeWidths = (rows: (string | number)[][]): number[] => {
        const widthArr: number[] = [];

        let len: number;
        let charsWidth: number;
        for (let row of rows) {
            len = row.length;
            for (let i = 0; i < len; i++) {
                charsWidth = 10 + row[i].toString().length * 10;
                if (!widthArr[i] || widthArr[i] < charsWidth)
                    widthArr[i] = charsWidth
            }
        }

        return widthArr;
    }

    /**
     * Fetches table from Google Drive permalink and parses it into state as JavaScript object.
     * Note: User needs to be authenticated, or biometry should not be available to be able to run this method.
     */
    const fetchTable = async (): Promise<void> => {

        if (authenticated !== AuthState.AUTHENTICATED && authenticated !== AuthState.NOT_SUPPORTED) {
            Alert.alert(
                "Auth error",
                "Seems like you are not authenticated!"
            );
            return;
        }

        setLoading(true);
        setTableData({});
        try {
            const res = await RNFetchBlob
                .config({fileCache: true})
                .fetch('GET', 'https://drive.google.com/uc?export=download&id=1O6bmi4TqBhYl7sMn1gBT2gM4rKf8paFf');

            const worksheet = XLSX.read(await res.base64(), {type: 'base64'});
            for (let sheetName in worksheet.Sheets) {
                const rows = XLSX.utils.sheet_to_json<(string | number)[]>(worksheet.Sheets[sheetName], {header: 1});
                setTableData({
                    [sheetName]: {
                        widthArr: computeWidths(rows),
                        rows
                    }
                });
            }
        } catch (err) {
            console.error(err);
            Alert.alert(
                "Při načítání tabulky se vyskytla chyba",
                "Chyba: " + err
            );
        }
        setLoading(false);
    }

    /**
     * Run authentication flow after component load
     */
    useEffect(() => {
        (async () => {
            await tryToAuthenticate();
        })();
    }, [])

    return (
        <SafeAreaView style={{flex: 1}}>
            <View style={{flex: 1}}>
                <View style={styles.biometryContainer}>
                    <Text style={styles.biometryText}>AuthState: {authenticated}</Text>
                    {authenticated !== AuthState.AUTHENTICATED && <Button title={"Authenticate"} onPress={async () => await tryToAuthenticate()}/>}
                </View>
                <View style={styles.tableContainer}>
                    <View style={styles.fetchButtonContainer}>
                        {loading ? <ActivityIndicator size={30}/> :
                            <Button color={"limegreen"} title={"Load table"} onPress={async () => await fetchTable()}/>}
                    </View>

                    {Object.keys(tableData).map((sheetName, i) => {
                        return <View key={i}>
                            <Text style={{fontWeight: 'bold', marginVertical: 5}}>{sheetName}</Text>
                            <ScrollView contentInsetAdjustmentBehavior="automatic" horizontal={true}>
                                <View>
                                    <Table>
                                        <Tr backgroundColor={"#dddddd"} first={true}>
                                            {tableData[sheetName].rows[0].map((value, k) => {
                                                return <Td width={tableData[sheetName].widthArr[k]} first={k === 0} key={k}>{value}</Td>
                                            })}
                                        </Tr>
                                    </Table>
                                    <ScrollView contentInsetAdjustmentBehavior="automatic">
                                        <Table>
                                            {tableData[sheetName].rows.map((row, j) => {
                                                if (j === 0 || row.length === 0)
                                                    return;
                                                return <Tr key={j} first={j <= 1}>
                                                    {row.map((value, k) => {
                                                        return <Td width={tableData[sheetName].widthArr[k]} first={k === 0} key={k}>{value}</Td>
                                                    })}
                                                </Tr>
                                            })}
                                        </Table>
                                    </ScrollView>
                                </View>
                            </ScrollView>
                        </View>
                    })}
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    biometryContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        height: 56,
        padding: 10,
        backgroundColor: "rgb(173,173,255)"
    },
    biometryText: {
        lineHeight: 37,
        color: "white",
        fontWeight: "bold"
    },
    tableContainer: {
        flex: 1,
        flexGrow: 1,
        margin: 10
    },
    fetchButtonContainer: {
        height: 40,
        justifyContent: "center"
    }
});

export default App;
