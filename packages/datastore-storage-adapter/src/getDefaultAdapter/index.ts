import { Adapter } from '@aws-amplify/datastore/lib-esm/storage/adapter';
import ExpoSQLiteAdapter from '../ExpoSQLiteAdapter/ExpoSQLiteAdapter';
const getDefaultAdapter: () => Adapter = () => {
	return ExpoSQLiteAdapter;
};

export default getDefaultAdapter;
