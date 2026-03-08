import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../../Config/FirebaseConfig';

export const departmentOptions = [
  { label: 'Computer Science', value: 'Computer Science' },
  { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
  { label: 'Civil Engineering', value: 'Civil Engineering' },
  { label: 'Electrical Engineering', value: 'Electrical Engineering' },
  { label: 'Electronics & Communication', value: 'Electronics & Communication' },
  { label: 'Information Technology', value: 'Information Technology' },
  { label: 'Chemical Engineering', value: 'Chemical Engineering' },
  { label: 'Biotechnology', value: 'Biotechnology' },
];

const basicDataRef = doc(firestore, 'BasicData', 'Data');

const normalizeString = (value = '') => `${value}`.trim();

export const normalizeList = (values = []) =>
  [...new Set(
    values
      .map((value) => normalizeString(value))
      .filter(Boolean)
  )];

export const createEntityId = (value = '') =>
  normalizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const normalizeClassDetail = (detail = {}) => {
  const name = normalizeString(detail.name || detail.className || detail.ClassName);

  return {
    id: detail.id || createEntityId(name),
    name,
    department: normalizeString(detail.department),
    section: normalizeString(detail.section),
    year: normalizeString(detail.year),
    semester: normalizeString(detail.semester),
    advisor: normalizeString(detail.advisor),
    capacity: Number.isFinite(Number(detail.capacity)) ? Number(detail.capacity) : 0,
    teachers: normalizeList(detail.teachers),
    subjects: normalizeList(detail.subjects),
    notes: normalizeString(detail.notes),
    createdAt: detail.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const mergeClassCollections = (classes = [], classDetails = []) => {
  const classMap = new Map();

  normalizeList(classes).forEach((className) => {
    classMap.set(className, normalizeClassDetail({ name: className }));
  });

  classDetails.forEach((detail) => {
    const normalized = normalizeClassDetail(detail);
    if (normalized.name) {
      classMap.set(normalized.name, {
        ...(classMap.get(normalized.name) || {}),
        ...normalized,
      });
    }
  });

  return [...classMap.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export const getInstitutionData = async () => {
  const snapshot = await getDoc(basicDataRef);
  const data = snapshot.exists() ? snapshot.data() : {};
  const subjects = normalizeList(data.Subjects || []);
  const classDetails = mergeClassCollections(data.Class || [], data.ClassDetails || []);
  const classes = normalizeList(classDetails.map((item) => item.name));

  return {
    raw: data,
    classes,
    subjects,
    classDetails,
  };
};

export const saveInstitutionData = async ({ classes = [], subjects = [], classDetails = [] }) => {
  const mergedClasses = mergeClassCollections(classes, classDetails);

  await setDoc(
    basicDataRef,
    {
      Class: normalizeList(mergedClasses.map((item) => item.name)),
      Subjects: normalizeList(subjects),
      ClassDetails: mergedClasses.map((item) => normalizeClassDetail(item)),
    },
    { merge: true }
  );
};

export const createDropdownItems = (values = []) =>
  normalizeList(values).map((value) => ({ label: value, value }));
