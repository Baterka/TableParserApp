import React from "react";
import {StyleSheet, Text, View} from "react-native";

/**
 * React Native does not support standard tables... So here is implementation with flexbox.
 */

export const Table: React.FC = ({children}) =>
    <View style={styles.table}>{children}</View>

export const Tr: React.FC<{ first?: boolean, backgroundColor?: string }> = ({children, first = false, backgroundColor}) =>
    <View style={[styles.tr, {
        borderTopWidth: first ? 1 : 0,
        backgroundColor
    }]}>{children}</View>

export const Td: React.FC<{ width?: number, first?: boolean }> = ({children, width = undefined, first = false}) =>
    <View style={[styles.td, {
        width,
        borderLeftWidth: first ? 1 : 0,
    }]}><Text numberOfLines={1}>{children}</Text></View>


const styles = StyleSheet.create({
    table: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    tr: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        borderBottomWidth: 1,
    },
    td: {
        alignSelf: 'stretch',
        flexDirection: 'row',
        minWidth: 1,
        padding: 5,
        borderRightWidth: 1
    },
});
