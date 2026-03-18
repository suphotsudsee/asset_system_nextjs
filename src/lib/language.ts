'use client';

import { useMemo, useSyncExternalStore } from 'react';

export type AppLanguage = 'th' | 'en';

export const LANGUAGE_STORAGE_KEY = 'app-language';
export const LANGUAGE_CHANGE_EVENT = 'app-language-change';

const defaultLanguage: AppLanguage = 'th';

const messages = {
  th: {
    sidebarDashboard: 'แดชบอร์ด',
    sidebarAssets: 'ครุภัณฑ์',
    sidebarDepreciation: 'ค่าเสื่อมราคา',
    sidebarMaintenance: 'บำรุงรักษา',
    sidebarQrScanner: 'สแกน QR',
    sidebarReports: 'รายงาน',
    sidebarSettings: 'ตั้งค่า',
    sidebarLogout: 'ออกจากระบบ',
    sidebarSystemAdministrator: 'ผู้ดูแลระบบ',
    headerDecreaseFont: 'ลดขนาดตัวอักษร',
    headerIncreaseFont: 'เพิ่มขนาดตัวอักษร',
    settingsTitle: 'ตั้งค่า',
    settingsBranding: 'Branding',
    settingsLanguage: 'ภาษา',
    settingsSystemName: 'ชื่อระบบด้านบน',
    settingsSystemSubtitle: 'คำอธิบายใต้ชื่อระบบ',
    settingsPreview: 'ตัวอย่าง',
    settingsSaveBranding: 'บันทึก Branding',
    settingsLanguageLabel: 'ภาษาที่ใช้ในระบบ',
    settingsLanguageHint: 'เลือกภาษาเริ่มต้นของหน้าจอผู้ใช้งาน',
    settingsSaveLanguage: 'บันทึกภาษา',
    settingsThai: 'ภาษาไทย',
    settingsEnglish: 'ภาษาอังกฤษ',
    settingsSavedBranding: 'บันทึก Branding เรียบร้อยแล้ว',
    settingsFillBranding: 'กรุณากรอกชื่อระบบและคำอธิบายให้ครบ',
    settingsManage: 'จัดการ',
    settingsDepartments: 'หน่วยงาน',
    settingsDepartmentsDesc: 'จัดการหน่วยงานและโครงสร้างภายใน',
    settingsCategories: 'หมวดหมู่ครุภัณฑ์',
    settingsCategoriesDesc: 'จัดการประเภทและหมวดหมู่ของครุภัณฑ์',
    settingsUsers: 'ผู้ใช้งาน',
    settingsUsersDesc: 'จัดการผู้ใช้และสิทธิ์การเข้าถึงระบบ',
    settingsSystemInfo: 'ข้อมูลระบบ',
    settingsVersion: 'เวอร์ชัน',
    settingsDatabase: 'ฐานข้อมูล',
    dashboardTitle: 'แดชบอร์ด',
    dashboardWelcome: 'สวัสดี, {name}!',
    dashboardRole: 'บทบาท: {role}',
    dashboardTotalAssets: 'ครุภัณฑ์ทั้งหมด',
    dashboardActiveAssets: 'ครุภัณฑ์ที่พร้อมใช้งาน',
    dashboardMaintenancePending: 'รายการรอดำเนินการ',
    dashboardTotalValue: 'มูลค่ารวม',
    dashboardQuickActions: 'เมนูด่วน',
    dashboardAddAsset: 'เพิ่มครุภัณฑ์',
    dashboardAddAssetDesc: 'สร้างรายการครุภัณฑ์ใหม่',
    dashboardViewAssets: 'ดูครุภัณฑ์',
    dashboardViewAssetsDesc: 'เรียกดูครุภัณฑ์ทั้งหมด',
    dashboardScanQr: 'สแกน QR',
    dashboardScanQrDesc: 'สแกนรหัสครุภัณฑ์',
    dashboardReports: 'รายงาน',
    dashboardReportsDesc: 'ดูข้อมูลวิเคราะห์',
    dashboardDemoMode: 'โหมดตัวอย่าง',
    dashboardDemoDesc: 'ขณะนี้แดชบอร์ดกำลังแสดงข้อมูลตัวอย่าง เชื่อมต่อ backend API เพื่อโหลดข้อมูลจริงจากฐานข้อมูล',
    assetsTitle: 'จัดการครุภัณฑ์',
    assetsAddNew: 'เพิ่มครุภัณฑ์ใหม่',
    assetsSearch: 'ค้นหา',
    assetsSearchPlaceholder: 'ค้นหาจากชื่อหรือรหัส...',
    assetsCategory: 'หมวดหมู่',
    assetsAllCategories: 'ทุกหมวดหมู่',
    assetsStatus: 'สถานะ',
    assetsAllStatus: 'ทุกสถานะ',
    assetsSelected: 'เลือกแล้ว: {count} รายการ',
    assetsPrintSelected: 'พิมพ์ QR ที่เลือก (A4)',
    assetsAssetCode: 'รหัสครุภัณฑ์',
    assetsName: 'ชื่อ',
    assetsDepartment: 'หน่วยงาน',
    assetsPrice: 'ราคา',
    assetsActions: 'จัดการ',
    assetsNoData: 'ไม่พบข้อมูลครุภัณฑ์',
    assetsView: 'ดู',
    assetsPrintQr: 'พิมพ์ QR',
    assetsEdit: 'แก้ไข',
    assetsDelete: 'ลบ',
    assetsPageOf: 'หน้า {page} จาก {total}',
    assetsPrevious: 'ก่อนหน้า',
    assetsNext: 'ถัดไป',
    assetsDeleteTitle: 'ยืนยันการลบ',
    assetsDeleteCancel: 'ยกเลิก',
    assetsDeleteConfirm: 'ลบ',
    assetsDeletePrompt: 'คุณต้องการลบครุภัณฑ์ "{name}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
    assetsDeleteSuccess: 'ลบครุภัณฑ์สำเร็จ',
    assetsDeleteFailed: 'ลบครุภัณฑ์ไม่สำเร็จ',
    assetsUnexpectedError: 'เกิดข้อผิดพลาด',
    assetsPrintPopupError: 'ไม่สามารถเปิดหน้าต่างพิมพ์ได้',
    assetsSelectBeforePrint: 'กรุณาเลือกรายการก่อนพิมพ์',
    assetsPrintHint: 'สแกน QR นี้เพื่อเปิดข้อมูลครุภัณฑ์',
    statusActive: 'ใช้งาน',
    statusInactive: 'ไม่ใช้งาน',
    statusMaintenance: 'ซ่อมบำรุง',
    statusDisposed: 'จำหน่ายแล้ว',
  },
  en: {
    sidebarDashboard: 'Dashboard',
    sidebarAssets: 'Assets',
    sidebarDepreciation: 'Depreciation',
    sidebarMaintenance: 'Maintenance',
    sidebarQrScanner: 'QR Scanner',
    sidebarReports: 'Reports',
    sidebarSettings: 'Settings',
    sidebarLogout: 'Logout',
    sidebarSystemAdministrator: 'System Administrator',
    headerDecreaseFont: 'Decrease font size',
    headerIncreaseFont: 'Increase font size',
    settingsTitle: 'Settings',
    settingsBranding: 'Branding',
    settingsLanguage: 'Language',
    settingsSystemName: 'System name',
    settingsSystemSubtitle: 'System subtitle',
    settingsPreview: 'Preview',
    settingsSaveBranding: 'Save Branding',
    settingsLanguageLabel: 'Application language',
    settingsLanguageHint: 'Choose the default language for the interface',
    settingsSaveLanguage: 'Save Language',
    settingsThai: 'Thai',
    settingsEnglish: 'English',
    settingsSavedBranding: 'Branding saved successfully',
    settingsFillBranding: 'Please enter both system name and subtitle',
    settingsManage: 'Manage',
    settingsDepartments: 'Departments',
    settingsDepartmentsDesc: 'Manage departments and internal structure',
    settingsCategories: 'Asset Categories',
    settingsCategoriesDesc: 'Manage asset types and categories',
    settingsUsers: 'Users',
    settingsUsersDesc: 'Manage users and access permissions',
    settingsSystemInfo: 'System Info',
    settingsVersion: 'Version',
    settingsDatabase: 'Database',
    dashboardTitle: 'Dashboard',
    dashboardWelcome: 'Hello, {name}!',
    dashboardRole: 'Role: {role}',
    dashboardTotalAssets: 'Total Assets',
    dashboardActiveAssets: 'Active Assets',
    dashboardMaintenancePending: 'Maintenance Pending',
    dashboardTotalValue: 'Total Value',
    dashboardQuickActions: 'Quick Actions',
    dashboardAddAsset: 'Add Asset',
    dashboardAddAssetDesc: 'Create new asset',
    dashboardViewAssets: 'View Assets',
    dashboardViewAssetsDesc: 'Browse all assets',
    dashboardScanQr: 'Scan QR',
    dashboardScanQrDesc: 'Scan asset QR code',
    dashboardReports: 'Reports',
    dashboardReportsDesc: 'View analytics',
    dashboardDemoMode: 'Demo Mode',
    dashboardDemoDesc: 'The dashboard is currently showing demo data. Connect the backend API to load real asset data from the database.',
    assetsTitle: 'Assets Management',
    assetsAddNew: 'Add New Asset',
    assetsSearch: 'Search',
    assetsSearchPlaceholder: 'Search by name or code...',
    assetsCategory: 'Category',
    assetsAllCategories: 'All Categories',
    assetsStatus: 'Status',
    assetsAllStatus: 'All Status',
    assetsSelected: 'Selected: {count} item(s)',
    assetsPrintSelected: 'Print Selected QR (A4)',
    assetsAssetCode: 'Asset Code',
    assetsName: 'Name',
    assetsDepartment: 'Department',
    assetsPrice: 'Price',
    assetsActions: 'Actions',
    assetsNoData: 'No asset data found',
    assetsView: 'View',
    assetsPrintQr: 'Print QR',
    assetsEdit: 'Edit',
    assetsDelete: 'Delete',
    assetsPageOf: 'Page {page} of {total}',
    assetsPrevious: 'Previous',
    assetsNext: 'Next',
    assetsDeleteTitle: 'Confirm Delete',
    assetsDeleteCancel: 'Cancel',
    assetsDeleteConfirm: 'Delete',
    assetsDeletePrompt: 'Do you want to delete asset "{name}"? This action cannot be undone.',
    assetsDeleteSuccess: 'Asset deleted successfully',
    assetsDeleteFailed: 'Failed to delete asset',
    assetsUnexpectedError: 'An unexpected error occurred',
    assetsPrintPopupError: 'Unable to open print window',
    assetsSelectBeforePrint: 'Please select at least one asset before printing',
    assetsPrintHint: 'Scan this QR code to open asset information.',
    statusActive: 'active',
    statusInactive: 'inactive',
    statusMaintenance: 'maintenance',
    statusDisposed: 'disposed',
  },
} as const;

type MessageKey = keyof typeof messages.th;

function getLanguageSnapshot() {
  if (typeof window === 'undefined') {
    return defaultLanguage;
  }

  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'en' || stored === 'th' ? stored : defaultLanguage;
}

function subscribeLanguage(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleChange = () => callback();
  window.addEventListener('storage', handleChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleChange);
  };
}

export function saveLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
}

export function useAppLanguage() {
  const language = useSyncExternalStore(subscribeLanguage, getLanguageSnapshot, () => defaultLanguage) as AppLanguage;

  return useMemo(() => {
    const t = (key: MessageKey, vars?: Record<string, string | number>) => {
      let template = messages[language][key] ?? messages.th[key];

      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          template = template.replaceAll(`{${name}}`, String(value));
        }
      }

      return template;
    };

    return {
      language,
      setLanguage: saveLanguage,
      t,
      locale: language === 'th' ? 'th-TH' : 'en-US',
    };
  }, [language]);
}
