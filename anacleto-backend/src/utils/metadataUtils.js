const fs = require("fs");
const appUtils = require("./appUtils");
const gitConnector = require("./../git/gitconnector");
const path = require("path");

class MetadataUtils {
	/**
	 * Ritorna il path relativo del file dei metdati rispetto a git
	 * @returns
	 */
	getMetadataRelativePath() {
		return path.join("metadata.json");
	}

	/**
	 * Ritorna il path assoluto del file dei metadati
	 * @param {*} application
	 * @returns
	 */
	getMetadataAbsolutePath(application) {
		return path.join(
			appUtils.getAppFolder(application),
			this.getMetadataRelativePath()
		);
	}



	/**
	 * Ritorna l'oggetto di una finestra
	 * @param {string} application application id
	 * @returns metadata string data
	 */
	getMetadataRawData(application) {
		if (!application) {
			throw "Application required!";
		}

		if (application == "BUILDER") {
			const metaPath = path.join(
				__dirname,
				"../builder",
				"metadata.json"
			);
			return fs.readFileSync(metaPath, "utf8");
		}

		const appConfiguration = appUtils.getAppConfiguration(application);
		if (!appConfiguration) {
			console.error(`App ${application} not found in .env file`);
			return null;
		}

		const metdataPath = this.getMetadataAbsolutePath(application);

		if (!fs.existsSync(metdataPath)) {
			return null;
		}

		return fs.readFileSync(metdataPath, "utf8");
	}

	/**
	 * * Aggiorna i metadati
	 * @param {*} application
	 * @param {*} user
	 * @param {*} metadataData
	 */
	updateMetadata(application, user, metadataData) {
		if (!application || !metadataData) {
			//la finestra esiste già
			return Promise.reject(new Error("missing metadata data"));
		}

		if (!this.getMetadataRawData(application)) {
			//i meta non esistono...
			return Promise.reject(new Error("metadata not exists"));
		}
		const metaPath = this.getMetadataRelativePath();
		return gitConnector.writeFile(
			application,
			user,
			metaPath,
			JSON.stringify(metadataData, null, 2)
		);
	}

	/**
	 * Return window translations
	 * 
	 * @param {string} appId application id
	 * @param {string} window  window name
	 * @param {string} language  language
	 * @returns translation object
	 */
	getAppTranslations(application, language) {
		if (!application) {
			throw "Application required!";
		}

		if (!language) {
			throw "Language required!";
		}

		if (application == "BUILDER") {
			const metaPath = path.join(
				__dirname,
				"../builder",
				"i18n.json"
			);
			return fs.readFileSync(metaPath, "utf8");
		}

		const appConfiguration = appUtils.getAppConfiguration(application);
		if (!appConfiguration) {
			console.error(`App ${application} not found in .env file`);
			return null;
		}

		const i18nLanguagePath = path.join(appUtils.getAppFolder(application), `i18n.${language.toLowerCase()}.json`);
		if (fs.existsSync(i18nLanguagePath)) {
			return fs.readFileSync(i18nLanguagePath, "utf8");
		}

		const i18nPath = path.join(appUtils.getAppFolder(application), `i18n.json`);
		if (fs.existsSync(i18nPath)) {
			return fs.readFileSync(i18nPath, "utf8");
		}


		return {}
	}

	/**
	 * Get 
	 * @param {String} application 
	 * @returns 
	 */
	getAppLanguages({ application }) {
		if (!application) {
			throw "Application required!"
		}

		if (application == "BUILDER") {
			return ["en"]
		}

		const appConfigration = appUtils.getAppConfiguration(application);
		if (!appConfigration) {
			console.error(`App ${application} not found in .env file`);
			return Promise.reject(`App ${application} not found`);
		}

		const appPath = appUtils.getAppFolder(application);
		const files = fs.readdirSync(appPath)
		return files.filter(file => {
			return file.startsWith("i18n.")
		})
	}
}

module.exports = new MetadataUtils();
