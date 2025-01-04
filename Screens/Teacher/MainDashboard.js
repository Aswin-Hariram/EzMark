import {
    Dimensions,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Platform,
    RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { PieChart } from "react-native-chart-kit";
import { Colors } from "../../assets/Colors";
import { useNavigation } from "@react-navigation/native";
import { collection, getDocs } from "firebase/firestore";
import Entypo from '@expo/vector-icons/Entypo';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Feather from '@expo/vector-icons/Feather';
import { firestore } from "../../Config/FirebaseConfig";

const MainDashboard = ({ teacherDetail }) => {
    const navi = useNavigation();
    const [classes, setClasses] = useState(teacherDetail?.classes || []);
    const [allRequests, setAllRequests] = useState([]);
    const [data, setData] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [noData, setNoData] = useState(false);

    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        color: (opacity = 1) => `rgba(15, 32, 48, ${opacity})`,
        strokeWidth: 1,
        barPercentage: 0.5,
        propsForLabels: {
            fontSize: 14,
            fontWeight: "bold",
            color: "blue",
        },
    };

    const generateShades = (baseColor, count) => {
        const shades = [];
        for (let i = 0; i < count; i++) {
            const shadeFactor = 0.5 + i * 0.2;
            const r = parseInt(baseColor.slice(1, 3), 16);
            const g = parseInt(baseColor.slice(3, 5), 16);
            const b = parseInt(baseColor.slice(5, 7), 16);
            shades.push(`rgba(${r}, ${g}, ${b}, ${shadeFactor})`);
        }
        return shades;
    };

    const countClassOccurrences = (requests) => {
        const shades = generateShades(Colors.PRIMARY, classes.length);

        const newData = classes.map((clas, index) => {
            const classCount = requests.filter((request) => request.class === clas).length;

            return {
                name: clas,
                population: classCount,
                color: shades[index],
                legendFontColor: "#333333",
                legendFontSize: 14,
            };
        });

        setData(newData);
    };

    const fetchClassAndSubject = async () => {
        try {
            if (!teacherDetail) throw new Error("Teacher not found");

            setIsRefreshing(true);
            const ref = collection(
                firestore,
                `UserData/${teacherDetail.id}/AttendanceRequests`
            );

            const docsSnap = await getDocs(ref);

            if (docsSnap.empty) throw new Error("No data found");

            const requests = docsSnap.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setAllRequests(requests);
            countClassOccurrences(requests);
        } catch (e) {
            console.log(e);
            setNoData(true);
            setAllRequests([]);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchClassAndSubject();
    }, [teacherDetail]);

    const renderHeader = () => (
        <View>
            <View style={styles.header}>
                <Feather name="menu" size={28} color="black" />
                <Text style={styles.headerText}>EzMark</Text>
                <MaterialCommunityIcons name="qrcode-scan" size={27} color="black" />
            </View>

            <View style={styles.grid}>
                <View style={styles.row}>
                    <View style={styles.column}>
                        <Text style={styles.gridValue}>{teacherDetail.classes.length}</Text>
                        <Text style={styles.gridLabel}>Classes</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.gridValue}>{allRequests.length}</Text>
                        <Text style={styles.gridLabel}>Hours</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Overview</Text>
            {allRequests.length>0 ? (
                <View style={styles.progressChartContainer}>
                    <PieChart
                        data={data}
                        width={Dimensions.get("window").width - 80}
                        height={220}
                        chartConfig={chartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                </View>
            ) : (
                <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
                    <Text>No Data found</Text>
                </View>
            )}
            <Text style={styles.sectionTitle}>Classes</Text>
        </View>
    );

    const renderClassItem = ({ item }) => (
        console.log("teacherDetail", teacherDetail),
        <TouchableOpacity onPress={() => { navi.navigate("ClassSummary", { className: item, teacherDetail:teacherDetail }); }}>
            <View style={styles.classContainer}>
                <View>
                    <Text style={styles.className}>{item}</Text>
                    <Text style={styles.classDep}>Department: Computer Science</Text>
                </View>
                <Entypo name="chevron-right" size={24} color={Colors.PRIMARY} />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
            
            <FlatList
                showsVerticalScrollIndicator={false}
                data={classes}
                ListHeaderComponent={renderHeader}
                renderItem={renderClassItem}
                keyExtractor={(item) => item}
                style={{ marginBottom: 20 }}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={fetchClassAndSubject}
                    />
                }
            />
        </SafeAreaView>
    );
};

export default MainDashboard;




const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        paddingTop: Platform.OS === 'android' ? 20 : 0,
        paddingHorizontal: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    leftIcon: {
        flexDirection: "row",
        alignItems: "center",
    },
    rightIcons: {
        flexDirection: "row",
        alignItems: "center",
    },
    icon: {
        marginLeft: 16,
    },
    backText: {
        marginLeft: 4,
        color: "black",
        fontSize: 18,
        fontFamily: "Metro-regular",
        fontWeight: "bold",
    },
    grid: {
        marginTop: 10,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        width: "100%",
    },
    column: {
        flex: 1,
        backgroundColor: "#ffffff",
        height: 70,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 8,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
        borderColor: "#e0e0e0",
        borderWidth: 1,
        marginHorizontal: 5,
    },
    gridValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333333",
    },
    gridLabel: {
        fontSize: 14,
        color: "#77777",
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginVertical: 8,
        marginHorizontal: 10,
        color: Colors.SECONDARY,
    },
    progressChartContainer: {
        backgroundColor: "#ffffff",
        marginVertical: 5,
        marginHorizontal: 8,
        borderRadius: 10,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    classContainer: {
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 10,
        position: "relative",
        backgroundColor: "white",
        borderRadius: 8,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        shadowRadius: 5,
        elevation: 3,
    },
    className: {
        fontSize: 18,
        marginBottom: 5,
        color: "black",
        fontWeight: "500",
        fontFamily: "Metro-regular",
    },
    classDep: {
        fontSize: 15,
        marginBottom: 5,
        color: "black",
        fontFamily: "Metro-regular",
        color:Colors.SECONDARY
    },
    detailsText: {
        fontSize: 14,
        color: "#555555",
        marginBottom: 10,
    },
    progressBar: {
        height: 10,
        backgroundColor: Colors.lightBg,
        borderRadius: 5,
        overflow: "hidden",
        marginVertical: 5,
    },
    progress: {
        height: "100%",
        backgroundColor: Colors.SECONDARY,
    },
});
