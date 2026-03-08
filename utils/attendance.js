const EARTH_RADIUS_METERS = 6371000;

export const DEFAULT_GEOFENCE_RADIUS_METERS = 120;

const toRadians = (value) => (value * Math.PI) / 180;

const toNumber = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

export const normalizeRadius = (value, fallback = DEFAULT_GEOFENCE_RADIUS_METERS) => {
  const numericValue = toNumber(value);

  if (!numericValue || numericValue < 25) {
    return fallback;
  }

  return Math.round(numericValue);
};

export const calculateDistanceMeters = (start, end) => {
  const startLatitude = toNumber(start?.latitude);
  const startLongitude = toNumber(start?.longitude);
  const endLatitude = toNumber(end?.latitude);
  const endLongitude = toNumber(end?.longitude);

  if (
    startLatitude === null
    || startLongitude === null
    || endLatitude === null
    || endLongitude === null
  ) {
    return null;
  }

  const latitudeDelta = toRadians(endLatitude - startLatitude);
  const longitudeDelta = toRadians(endLongitude - startLongitude);
  const startLatitudeRadians = toRadians(startLatitude);
  const endLatitudeRadians = toRadians(endLatitude);

  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2)
    + Math.cos(startLatitudeRadians)
      * Math.cos(endLatitudeRadians)
      * Math.sin(longitudeDelta / 2)
      * Math.sin(longitudeDelta / 2);

  const arc = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return Math.round(EARTH_RADIUS_METERS * arc);
};

export const createAttendanceQrToken = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const buildAttendanceQrPayload = ({ requestId, teacherId, createdAt, qrToken }) =>
  JSON.stringify({
    requestId,
    teacherId,
    createdAt,
    qrToken,
  });

export const parseAttendanceQrPayload = (rawValue) => {
  try {
    const parsedValue = JSON.parse(rawValue);

    if (
      !parsedValue
      || typeof parsedValue.requestId !== 'string'
      || typeof parsedValue.teacherId !== 'string'
      || typeof parsedValue.createdAt !== 'string'
      || typeof parsedValue.qrToken !== 'string'
    ) {
      return null;
    }

    return parsedValue;
  } catch (error) {
    return null;
  }
};
