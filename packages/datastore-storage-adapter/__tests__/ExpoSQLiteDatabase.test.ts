import ExpoSQLiteDatabase from '../src/ExpoSQLiteAdapter/ExpoSQLiteDatabase';
import { ParameterizedStatement } from '../src/common/types';

jest.mock('expo-sqlite', () => ({
	openDatabase: jest.fn(() => mockDatabase),
}));

jest.mock('expo-file-system', () => ({
	deleteAsync: jest.fn(path => null),
	documentDirectory: '/sample/path',
}));

const mockDatabase = {
	readTransaction: jest.fn(),
	transaction: jest.fn(),
	_db: { close: jest.fn(() => {}) },
};
const mockTransaction = { executeSql: jest.fn() };

mockDatabase.readTransaction.mockImplementation(func => {
	func(mockTransaction);
});
mockDatabase.transaction.mockImplementation(func => {
	func(mockTransaction);
});

const MOCK_SQL_ERROR = new Error('Sample_Error');

/* {
	code: 400,
	message: 'Error performing the transaction',
}; */

const DEFAULT_STATEMENT = 'SELECT * FROM ABCD';
const DEFAULT_STATEMENT_PARAMS = [];
const MOCK_RESULT_ARRAY_NUMBER = [1, 2, 3, 4];
const MOCK_RESULT_ARRAY_STRING = ['this', 'is', 'a', 'string'];

const MOCK_RESULT_SET_NUMBER = {
	rows: {
		_array: MOCK_RESULT_ARRAY_NUMBER,
	},
};

const MOCK_RESULT_SET_STRING = {
	rows: {
		_array: MOCK_RESULT_ARRAY_STRING,
	},
};

const MOCK_RESULT_SET_EMPTY = {
	rows: {
		_array: [],
	},
};

describe('ExpoSQLiteDatabase', () => {
	const instance = new ExpoSQLiteDatabase();

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('init', () => {
		it('should call openDatabase and assign returned value to private variable db', async () => {
			await instance.init();
			await expect((instance as any).db).toBeDefined();
		});
	});

	describe('getAll', () => {
		it('should resolve promise and return whole result array when transaction is successful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_NUMBER);
				}
			);
			await expect(
				instance.getAll(DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS)
			).resolves.toStrictEqual(MOCK_RESULT_ARRAY_NUMBER);
		});

		it('should resolve promise and return empty array when no result is found', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_EMPTY);
				}
			);

			await expect(
				instance.getAll(DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS)
			).resolves.toStrictEqual([]);
		});

		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					errorCallback(mockTransaction, MOCK_SQL_ERROR);
				}
			);

			await expect(
				instance.getAll(DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});
	});

	describe('get', () => {
		it('should resolve promise and return first element when transaction is successful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_NUMBER);
				}
			);
			await expect(
				instance.get(DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS)
			).resolves.toStrictEqual(MOCK_RESULT_ARRAY_NUMBER[0]);
		});

		it('should resolve promise and return undefined when no result is found', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_EMPTY);
				}
			);

			await expect(
				instance.get(DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS)
			).resolves.toStrictEqual(undefined);
		});

		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					errorCallback(mockTransaction, MOCK_SQL_ERROR);
				}
			);

			await expect(
				instance.get(DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});
	});

	describe('save', () => {
		it('should resolve promise and return null when transaction is successful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_NUMBER);
				}
			);
			await expect(
				instance.save(DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS)
			).resolves.toBeNull();
		});

		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					errorCallback(mockTransaction, MOCK_SQL_ERROR);
				}
			);

			await expect(
				instance.save(DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});
	});

	describe('batchQuery', () => {
		const queryParameterizedStatements: Set<ParameterizedStatement> = new Set([
			[DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS],
			[DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS],
		]);

		it('should resolve promise and return first element of each query result', async () => {
			mockTransaction.executeSql
				.mockImplementationOnce(
					(statement, params, successCallback, errorCallback) => {
						successCallback(mockTransaction, MOCK_RESULT_SET_NUMBER);
					}
				)
				.mockImplementation(
					(statement, params, successCallback, errorCallback) => {
						successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
					}
				);

			await expect(
				instance.batchQuery(queryParameterizedStatements)
			).resolves.toStrictEqual([
				MOCK_RESULT_ARRAY_NUMBER[0],
				MOCK_RESULT_ARRAY_STRING[0],
			]);
		});

		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					errorCallback(mockTransaction, MOCK_SQL_ERROR);
				}
			);

			await expect(
				instance.batchQuery(queryParameterizedStatements)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});

		it('should reject promise and return error when the any SQL execution is unsuccessful', async () => {
			mockTransaction.executeSql
				.mockImplementationOnce(
					(statement, params, successCallback, errorCallback) => {
						successCallback(mockTransaction, MOCK_RESULT_SET_NUMBER);
					}
				)
				.mockImplementation(
					(statement, params, successCallback, errorCallback) => {
						errorCallback(mockTransaction, MOCK_SQL_ERROR);
					}
				);

			await expect(
				instance.batchQuery(queryParameterizedStatements)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});
	});

	describe('batchSave', () => {
		const saveParameterizedStatements: Set<ParameterizedStatement> = new Set([
			[DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS],
			[DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS],
		]);

		const deleteParameterizedStatements: Set<ParameterizedStatement> = new Set([
			[DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS],
			[DEFAULT_STATEMENT, DEFAULT_STATEMENT_PARAMS],
		]);

		it('should resolve to null when successful and provided multiple save statements only', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
				}
			);

			await expect(
				instance.batchSave(saveParameterizedStatements)
			).resolves.toBeNull();
		});

		it('should resolve to null when successful and provided multiple save and delete statements', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
				}
			);

			await expect(
				instance.batchSave(
					saveParameterizedStatements,
					deleteParameterizedStatements
				)
			).resolves.toBeNull();
		});

		it('should resolve to null when successful and provided multiple delete statements only', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
				}
			);

			await expect(
				instance.batchSave(undefined, deleteParameterizedStatements)
			).resolves.toBeNull();
		});

		it('should resolve to null when successful and provided no statements at all', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
				}
			);

			await expect(instance.batchSave()).resolves.toBeNull();
		});

		it('should resolve to null when successful and provided multiple saveStatements', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					errorCallback(mockTransaction, MOCK_SQL_ERROR);
				}
			);

			await expect(
				instance.batchSave(saveParameterizedStatements)
			).rejects.toMatchObject(MOCK_SQL_ERROR);
		});

		it('should resolve to null when successful and provided multiple save and delete statements', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					errorCallback(mockTransaction, MOCK_SQL_ERROR);
				}
			);
			/* 			expect.assertions(1);
			 */
			await expect(
				instance.batchSave(
					saveParameterizedStatements,
					deleteParameterizedStatements
				)
			).rejects.toEqual(MOCK_SQL_ERROR);
		});

		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql
				.mockImplementationOnce(
					(statement, params, successCallback, errorCallback) => {
						errorCallback(mockTransaction, MOCK_SQL_ERROR);
					}
				)
				.mockImplementation(
					(statement, params, successCallback, errorCallback) => {
						successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
					}
				);

			await expect(
				instance.batchSave(
					saveParameterizedStatements,
					deleteParameterizedStatements
				)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});

		// test sqlerror in when running deleteStatements
		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql
				.mockImplementationOnce(
					(statement, params, successCallback, errorCallback) => {
						successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
					}
				)
				.mockImplementationOnce(
					(statement, params, successCallback, errorCallback) => {
						successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
					}
				)
				.mockImplementation(
					(statement, params, successCallback, errorCallback) => {
						errorCallback(mockTransaction, MOCK_SQL_ERROR);
					}
				);

			await expect(
				instance.batchSave(
					saveParameterizedStatements,
					deleteParameterizedStatements
				)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});

		// test sqlerror in when running saveStatements
		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql
				.mockImplementationOnce(
					(statement, params, successCallback, errorCallback) => {
						errorCallback(mockTransaction, MOCK_SQL_ERROR);
					}
				)
				.mockImplementationOnce(
					(statement, params, successCallback, errorCallback) => {
						successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
					}
				)
				.mockImplementation(
					(statement, params, successCallback, errorCallback) => {
						successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
					}
				);

			await expect(
				instance.batchSave(
					saveParameterizedStatements,
					deleteParameterizedStatements
				)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});
	});

	describe('selectAndDelete', () => {
		const queryParameterizedStatement: ParameterizedStatement = [
			DEFAULT_STATEMENT,
			DEFAULT_STATEMENT_PARAMS,
		];
		const deleteParameterizedStatement: ParameterizedStatement = [
			DEFAULT_STATEMENT,
			DEFAULT_STATEMENT_PARAMS,
		];

		it('should resolve promise and return the result array of select query when transaction is successful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
				}
			);

			await expect(
				instance.selectAndDelete(
					queryParameterizedStatement,
					deleteParameterizedStatement
				)
			).resolves.toStrictEqual(MOCK_RESULT_ARRAY_STRING);
		});

		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					errorCallback(mockTransaction, MOCK_SQL_ERROR);
				}
			);

			await expect(
				instance.selectAndDelete(
					queryParameterizedStatement,
					deleteParameterizedStatement
				)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});

		// test sqlerror in when running saveStatements
		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql
				.mockImplementationOnce(
					(statement, params, successCallback, errorCallback) => {
						successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
					}
				)
				.mockImplementationOnce(
					(statement, params, successCallback, errorCallback) => {
						errorCallback(mockTransaction, MOCK_SQL_ERROR);
					}
				)
				.mockImplementation(
					(statement, params, successCallback, errorCallback) => {
						successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
					}
				);

			await expect(
				instance.selectAndDelete(
					queryParameterizedStatement,
					deleteParameterizedStatement
				)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});
	});

	describe('executeStatements', () => {
		const statements = [
			DEFAULT_STATEMENT,
			DEFAULT_STATEMENT,
			DEFAULT_STATEMENT,
		];

		it('should resolve promise and return null when transaction is successful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
				}
			);

			await expect(
				(instance as any).executeStatements(statements)
			).resolves.toBeNull();
		});

		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					errorCallback(mockTransaction, MOCK_SQL_ERROR);
				}
			);

			await expect(
				(instance as any).executeStatements(statements)
			).rejects.toStrictEqual(MOCK_SQL_ERROR);
		});
	});

	describe('createSchema', () => {
		const statements = [
			DEFAULT_STATEMENT,
			DEFAULT_STATEMENT,
			DEFAULT_STATEMENT,
		];

		it('should resolve promise and return null when transaction is successful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					successCallback(mockTransaction, MOCK_RESULT_SET_STRING);
				}
			);

			await expect(instance.createSchema(statements)).resolves.toBeNull();
		});

		it('should reject promise and return error when the transaction is unsuccessful', async () => {
			mockTransaction.executeSql.mockImplementation(
				(statement, params, successCallback, errorCallback) => {
					errorCallback(mockTransaction, MOCK_SQL_ERROR);
				}
			);

			await expect(instance.createSchema(statements)).rejects.toStrictEqual(
				MOCK_SQL_ERROR
			);
		});
	});

	describe('closeDB', () => {
		it('should close the database and set db variable to undefined', async () => {
			await (instance as any).closeDB();
			expect((instance as any).db).toBeUndefined();
		});
	});

	describe('clear', () => {
		it('should delete the database and set db variable to undefined', async () => {
			// init the database as it was closed in the above test.
			await instance.init();
			await instance.clear();
			expect((instance as any).db).toBeUndefined();
			expect(mockDatabase._db.close).toBeCalled();
		});
	});
});
