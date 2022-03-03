import { StorageAdapter } from '@aws-amplify/datastore';
import ExpoSQLiteAdapter from '../ExpoSQLiteAdapter/ExpoSQLiteAdapter';
const getDefaultAdapter: () => StorageAdapter = () => {
	return ExpoSQLiteAdapter;
};

export default getDefaultAdapter;
