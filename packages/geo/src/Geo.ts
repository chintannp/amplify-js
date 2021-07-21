/*
 * Copyright 2017-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with
 * the License. A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions
 * and limitations under the License.
 */
import {
	Amplify,
	ConsoleLogger as Logger,
	parseMobileHubConfig,
} from '@aws-amplify/core';
import { AmazonLocationServicesProvider } from './Providers/AmazonLocationServicesProvider';

import {
	GeoConfig,
	Coordinates,
	SearchByTextOptions,
	GeoProvider,
} from './types';

const logger = new Logger('Geo');

const DEFAULT_PROVIDER = 'AmazonLocationServices';
export class GeoClass {
	static MODULE = 'Geo';
	/**
	 * @private
	 */
	private _config: GeoConfig;
	private _pluggables: GeoProvider[];

	constructor() {
		this._config = {};
		this._pluggables = [];
		logger.debug('Geo Options', this._config);

		this.getAvailableMaps.bind(this);
		this.getDefaultMap.bind(this);
		this.searchByText.bind(this);
	}

	public getModuleName() {
		return GeoClass.MODULE;
	}

	/**
	 * add plugin into Geo category
	 * @param {Object} pluggable - an instance of the plugin
	 */
	public addPluggable(pluggable: GeoProvider) {
		if (pluggable && pluggable.getCategory() === 'Geo') {
			this._pluggables.push(pluggable);
			let config = {};

			config = pluggable.configure(this._config[pluggable.getProviderName()]);

			return config;
		}
	}

	/**
	 * Get the plugin object
	 * @param providerName - the name of the plugin
	 */
	public getPluggable(providerName: string) {
		const pluggable = this._pluggables.find(
			pluggable => pluggable.getProviderName() === providerName
		);
		if (pluggable === undefined) {
			logger.debug('No plugin found with providerName', providerName);
			return null;
		} else return pluggable;
	}

	/**
	 * Remove the plugin object
	 * @param providerName - the name of the plugin
	 */
	public removePluggable(providerName: string) {
		this._pluggables = this._pluggables.filter(
			pluggable => pluggable.getProviderName() !== providerName
		);
		return;
	}

	/**
	 * Configure Geo
	 * @param {Object} config - Configuration object for Geo
	 * @return {Object} - Current configuration
	 */
	configure(config?) {
		logger.debug('configure Geo');

		if (!config) return this._config;

		const amplifyConfig = parseMobileHubConfig(config);
		this._config = Object.assign({}, this._config, amplifyConfig.geo);

		this._pluggables.forEach(pluggable => {
			pluggable.configure(this._config);
		});

		if (this._pluggables.length === 0) {
			const locationServicesProvider = new AmazonLocationServicesProvider();
			locationServicesProvider.configure(this._config);
			this.addPluggable(locationServicesProvider);
		}
		return this._config;
	}

	public getAvailableMaps(provider = DEFAULT_PROVIDER) {
		const prov = this._pluggables.find(
			pluggable => pluggable.getProviderName() === provider
		);

		if (prov === undefined) {
			logger.debug('No plugin found with providerName', provider);
			return 'No plugin found in Geo for the provider';
		}

		return prov.getAvailableMaps();
	}

	public getDefaultMap(provider = DEFAULT_PROVIDER) {
		const prov = this._pluggables.find(
			pluggable => pluggable.getProviderName() === provider
		);

		if (prov === undefined) {
			logger.debug('No plugin found with providerName', provider);
			return 'No plugin found in Geo for the provider';
		}

		return prov.getDefaultMap();
	}

	public async searchByText(text: string, options?: SearchByTextOptions) {
		const { provider = DEFAULT_PROVIDER } = options || {};
		const prov = this._pluggables.find(
			pluggable => pluggable.getProviderName() === provider
		);
		if (prov === undefined) {
			logger.debug('No plugin found with providerName', provider);
			return Promise.reject('No plugin found in Geo for the provider');
		}

		const responsePromise = await prov.searchByText(text, options);
		return responsePromise;
	}
}

export const Geo = new GeoClass();
Amplify.register(Geo);