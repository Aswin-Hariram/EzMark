import { Dimensions, FlatList, SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProgressChart } from "react-native-chart-kit";
import { Colors } from '../../assets/Colors';

const MainDashboard = () => {
    const data = {
        labels: ["CSE I", "CSE II", "CSE III", "CSE IV", "CSE V"],
        data: [0.4, 0.6, 0.8, 0.2, 0.9],
    };

    const present = [
        { id: 1, class: "CSE I", total: 64, present: 30 },
        { id: 2, class: "CSE II", total: 74, present: 54 },
        { id: 3, class: "CSE III", total: 50, present: 30 },
        { id: 4, class: "CSE IV", total: 59, present: 55 },
        { id: 5, class: "CSE V", total: 70, present: 60 },
    ];

    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#ffffff",
        backgroundGradientToOpacity: 0.5,
        color: (opacity = 1) => `rgba(21, 52, 72, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
    };

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <TouchableOpacity style={styles.leftIcon} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>Dashboard</Text>
                </TouchableOpacity>
                <View style={styles.rightIcons}>
                    <TouchableOpacity style={styles.icon}>
                        <Ionicons name="search-outline" size={24} color={Colors.PRIMARY} />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.grid}>
                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.gridValue}>10</Text>
                        <Text style={styles.gridLabel}>Classes</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.gridValue}>12</Text>
                        <Text style={styles.gridLabel}>Subjects</Text>
                    </View>
                </View>
            </View>



            {/* Progress Chart */}
            <Text style={styles.sectionTitle}>The Overview</Text>
            <View style={styles.progressChartContainer}>
                <ProgressChart
                    data={data}
                    width={Dimensions.get("window").width - 40}
                    height={220}
                    strokeWidth={10}
                    radius={32}
                    chartConfig={chartConfig}
                    hideLegend={false}
                />
            </View>


            {/* Classes Section Title */}
            <Text style={styles.sectionTitle}>Classes</Text>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f4f4' }}>
            <FlatList
                data={present}
                ListHeaderComponent={renderHeader}
                renderItem={({ item }) => (
                    <View style={styles.classContainer}>
                        <Text style={styles.className}>{item.class}</Text>
                        <Text style={styles.detailsText}>
                            Present: {item.present} | Absent: {item.total - item.present}
                        </Text>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progress,
                                    { width: `${(item.present / item.total) * 100}%` },
                                ]}
                            />
                        </View>
                    </View>
                )}
                keyExtractor={(item) => item.id.toString()}
            />
        </SafeAreaView>
    );
};

export default MainDashboard;

const styles = StyleSheet.create({
    header: {
        height: 60,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderBottomWidth: 0.5,
        borderColor: Colors.lightBg,
    },
    leftIcon: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginLeft: 16,
    },
    backText: {
        marginLeft: 4,
        color: "black",
        fontSize: 18,
        fontFamily: "Metro-regular",
        fontWeight: 'bold',
    },
    title: {
        textAlign: 'center',
        marginVertical: 20,
        fontSize: 25,
        fontWeight: 'bold',
        color: '#003300',
    },
    grid: {
        marginTop: 5,
        marginHorizontal: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 5, // Add padding for spacing
        width: '100%',
    },
    column: {
        flex: 1,
        backgroundColor: '#ffffff',
        height: 70,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        marginHorizontal: 5, // Add margin for spacing
    },
    gridValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333333',
    },
    gridLabel: {
        fontSize: 14,
        color: '#888888',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 15,
        marginHorizontal: 10,
        color: '#003300',
    },
    progressChartContainer: {
        backgroundColor: '#ffffff',
        marginVertical: 10,
        marginHorizontal: 10,
        borderRadius: 10,
        padding: 15,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    classContainer: {
        padding: 15,
        marginVertical: 10,
        marginHorizontal: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    className: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: 'black',
        fontWeight: 'condensedBold',
        fontFamily: "Metro-regular"
    },
    detailsText: {
        fontSize: 14,
        color: '#555555',
        marginBottom: 10,
    },
    progressBar: {
        height: 10,
        backgroundColor: Colors.lightBg,
        borderRadius: 5,
        overflow: 'hidden',
        marginVertical: 5,
    },
    progress: {
        height: '100%',
        backgroundColor: Colors.SECONDARY,
    },
});
