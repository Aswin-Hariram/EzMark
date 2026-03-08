import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { ActivityIndicator } from 'react-native-paper';
import { Colors } from '../../assets/Colors';
import { auth, firestore } from '../../Config/FirebaseConfig';
import ManageStudents from './ManageStudents';
import ManageClasses from './ManageClasses';
import ManageTeachers from './ManageTeachers';
import ManageSubjects from './ManageSubjects';
import AdminMainDashBoard from './AdminMainDashBoard';

const sectionItems = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'teachers', label: 'Teachers', icon: 'groups' },
  { key: 'students', label: 'Students', icon: 'school' },
  { key: 'classes', label: 'Classes', icon: 'class' },
  { key: 'subjects', label: 'Subjects', icon: 'menu-book' },
];

const quickActionItems = [
  { key: 'AddTeacher', label: 'Add Teacher', icon: 'person-add-alt-1' },
  { key: 'AddStudent', label: 'Add Student', icon: 'group-add' },
  { key: 'AddClass', label: 'Add Class', icon: 'playlist-add' },
  { key: 'AddAdmin', label: 'Add Admin', icon: 'admin-panel-settings' },
];

const AdminDashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 980;
  const [activeSection, setActiveSection] = useState('dashboard');
  const [menuVisible, setMenuVisible] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  useEffect(() => {
    const loadAdmin = async () => {
      try {
        const userEmail = auth.currentUser?.email;

        if (!userEmail) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
          return;
        }

        const adminQuery = query(
          collection(firestore, 'UserData'),
          where('email', '==', userEmail),
          where('type', '==', 'Admin')
        );

        const adminSnapshot = await getDocs(adminQuery);
        const adminRecord = adminSnapshot.docs[0];
        setAdminData(adminRecord ? { id: adminRecord.id, ...adminRecord.data() } : null);
      } catch (error) {
        console.log('Error loading admin profile:', error);
        setAdminData(null);
      } finally {
        setLoadingAdmin(false);
      }
    };

    loadAdmin();
  }, [navigation]);

  useEffect(() => {
    if (isWideLayout && menuVisible) {
      setMenuVisible(false);
    }
  }, [isWideLayout, menuVisible]);

  const activeSectionLabel = useMemo(
    () => sectionItems.find((item) => item.key === activeSection)?.label || 'Dashboard',
    [activeSection]
  );

  const openSection = (sectionKey) => {
    setActiveSection(sectionKey);
    setMenuVisible(false);
  };

  const handleQuickAction = (routeName) => {
    setMenuVisible(false);
    navigation.navigate(routeName);
  };

  const handleOpenProfile = () => {
    if (!adminData) {
      return;
    }

    setMenuVisible(false);
    navigation.navigate('AdminProfile', { adminData });
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    });
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'teachers':
        return <ManageTeachers embedded />;
      case 'students':
        return <ManageStudents embedded />;
      case 'classes':
        return <ManageClasses embedded />;
      case 'subjects':
        return <ManageSubjects embedded />;
      case 'dashboard':
      default:
        return <AdminMainDashBoard onOpenSection={openSection} embedded />;
    }
  };

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarTop}>
        <Text style={styles.sidebarEyebrow}>EzMark Admin</Text>
        <Text style={styles.sidebarTitle}>Control Menu</Text>
      </View>

      <View style={styles.sidebarGroup}>
        {sectionItems.map((item) => {
          const isActive = activeSection === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => openSection(item.key)}
            >
              <MaterialIcons
                name={item.icon}
                size={20}
                color={isActive ? '#FFFFFF' : Colors.PRIMARY}
              />
              <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.sidebarGroup}>
        <Text style={styles.sidebarGroupLabel}>Quick Actions</Text>
        {quickActionItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.secondaryMenuItem}
            onPress={() => handleQuickAction(item.key)}
          >
            <MaterialIcons name={item.icon} size={18} color={Colors.PRIMARY} />
            <Text style={styles.secondaryMenuText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sidebarFooter}>
        <TouchableOpacity
          style={styles.footerAction}
          onPress={handleOpenProfile}
          disabled={!adminData || loadingAdmin}
        >
          <Feather name="user" size={18} color={Colors.PRIMARY} />
          <Text style={styles.footerActionText}>
            {adminData?.name ? `${adminData.name.split(' ')[0]}'s Profile` : 'Profile'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerAction} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color={Colors.PRIMARY} />
          <Text style={styles.footerActionText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.shell}>
        {isWideLayout ? <View style={[styles.sidebarRail, { paddingTop: insets.top }]}>{renderSidebar()}</View> : null}

        <View style={styles.contentColumn}>
          <View style={styles.topBar}>
            {!isWideLayout ? (
              <TouchableOpacity style={styles.menuTrigger} onPress={() => setMenuVisible(true)}>
                <Feather name="menu" size={22} color={Colors.PRIMARY} />
              </TouchableOpacity>
            ) : (
              <View style={styles.menuTriggerPlaceholder} />
            )}

            <View style={styles.topBarCopy}>
              <Text style={styles.topBarLabel}>Admin Workspace</Text>
              <Text style={styles.topBarTitle}>{activeSectionLabel}</Text>
            </View>

            <TouchableOpacity style={styles.topBarAction} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color={Colors.PRIMARY} />
            </TouchableOpacity>
          </View>

          <View style={styles.contentSurface}>
            {loadingAdmin && !adminData && activeSection === 'dashboard' ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={styles.loadingText}>Loading admin workspace...</Text>
              </View>
            ) : (
              renderSectionContent()
            )}
          </View>
        </View>
      </View>

      {!isWideLayout ? (
        <Modal
          visible={menuVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable style={styles.drawerBackdrop} onPress={() => setMenuVisible(false)}>
            <Pressable style={[styles.drawerPanel, { paddingTop: insets.top }]} onPress={() => {}}>
              <SafeAreaView edges={["top", "left", "bottom"]} style={styles.drawerSidebar}>
                {renderSidebar()}
              </SafeAreaView>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAF0F5',
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarRail: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E1E8EE',
  },
  sidebar: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  sidebarTop: {
    marginBottom: 24,
  },
  sidebarEyebrow: {
    color: '#6D8090',
    fontWeight: '700',
    marginBottom: 6,
  },
  sidebarTitle: {
    color: Colors.PRIMARY,
    fontSize: 24,
    fontWeight: '800',
  },
  sidebarGroup: {
    marginBottom: 20,
  },
  sidebarGroupLabel: {
    color: '#7A8A97',
    fontWeight: '700',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    backgroundColor: '#F5F8FB',
  },
  menuItemActive: {
    backgroundColor: Colors.PRIMARY,
  },
  menuItemText: {
    marginLeft: 12,
    color: Colors.PRIMARY,
    fontWeight: '700',
    fontSize: 15,
  },
  menuItemTextActive: {
    color: '#FFFFFF',
  },
  secondaryMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    backgroundColor: '#F8FBFD',
  },
  secondaryMenuText: {
    marginLeft: 10,
    color: Colors.PRIMARY,
    fontWeight: '600',
  },
  sidebarFooter: {
    marginTop: 'auto',
    gap: 10,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: '#F4F7FB',
  },
  footerActionText: {
    marginLeft: 10,
    color: Colors.PRIMARY,
    fontWeight: '700',
  },
  contentColumn: {
    flex: 1,
    minWidth: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
  },
  menuTrigger: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTriggerPlaceholder: {
    width: 44,
  },
  topBarCopy: {
    flex: 1,
    marginHorizontal: 14,
  },
  topBarLabel: {
    color: '#708392',
    fontWeight: '700',
    marginBottom: 2,
  },
  topBarTitle: {
    color: Colors.PRIMARY,
    fontSize: 24,
    fontWeight: '800',
  },
  topBarAction: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSurface: {
    flex: 1,
    minHeight: 0,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6C7D8B',
    fontWeight: '600',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 43, 60, 0.28)',
    justifyContent: 'flex-start',
  },
  drawerPanel: {
    width: 294,
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  drawerSidebar: {
    flex: 1,
  },
});

export default AdminDashboardScreen;
