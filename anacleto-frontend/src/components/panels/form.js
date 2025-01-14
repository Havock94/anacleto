import React, { useState, useEffect, useContext, useCallback } from "react";
import { classNames } from "primereact/utils";
import axios from "axios";
import { getToken } from "../../login/loginUtils";
import PropTypes from "prop-types";
import { PanelsContext, PANEL_STATUS_READY } from "../../contexts/panelsContext";
import { defaultMemoizeFunction } from "../../utils/utils";

//TODO questa logica ha ancor senso? da capire....
const FormMode = Object.freeze({
	INSERT: "insert",
	UPDATE: "update",
	FREE: "free",
});
function Form({ id, context, panelContext, ...props }) {
	const { panelsContext, updatePanelContext } = useContext(PanelsContext);
	const application = context.application;
	const destApplication = context.destApplication;
	const tenant = context.tenant;

	const [record, setRecord] = useState(props.record || {}); //contiene il record associato al pannello
	const [items, setItems] = useState(props.items);
	const [mode, setMode] = useState(props.mode || FormMode.FREE);

	const _setRecord = useCallback((payload) => { setRecord((prev) => ({...prev, ...payload})) });
	useEffect(() => {
		updatePanelContext({
			id,
			setRecord: _setRecord,
			save: function () {
				if (mode === FormMode.FREE) {
					throw new Error("Invalid form mode.");
				}

				if (!props.dataModel) {
					throw new Error("Missing data model.");
				}

				let method;
				switch (mode) {
					case FormMode.INSERT:
						method = "post";
						break;
					case FormMode.UPDATE:
						method = "patch";
						break;
					default:
						break;
				}

				getToken()
					.then(token => {
						return axios({
							method: method,
							baseUrl: `${process.env.REACT_APP_BACKEND_HOST}`,
							url: `/form`,
							timeout: 60000,
							params: {
								windowId: context.windowId,
								panelId: id,
							},
							headers: {
								Authorization: token,
								"Content-Type": "application/json",
								application: application,
								tenant: tenant,
							},
							data: record,
						});
					})

					.then(function (response) {
						console.log(response);
					})
					.catch(function (error) {
						console.log(error);
					});
			},
			load: (_params) => (new Promise((resolve, reject) => {
				//unisco i parametri passati a quelli del pannello
				var params = Object.assign(_params, {
					windowId: context.windowId,
					script: props.script,
				});
				getToken()
					.then(token => {
						return axios.get(
							`${process.env.REACT_APP_BACKEND_HOST}/processScript?panel=${props.id}&script=${props.store}`,
							{
								timeout: 60000,
								params: params,
								headers: {
									Authorization:token,
									application: application,
									destapplication: destApplication,
									tenant: tenant,
								},
							}
						)
					})
					.then(function (response) {
						if (response.data) {
							setRecord(response.data);
						}
						resolve(response);
					})
					.catch(function (error) {
						console.log(error);
						window.utils.showToast({
							severity: "error",
							summary: "Error",
							detail: "Server error, can't load form",
							sticky: true,
						});
						reject(error);
					})
			})),
			setItems: (_items) => (setItems(_items)),
		})
	}, []);

	useEffect(() => {
		//Set the getRecord function again otherwise it won't get the updated record object
		if(record){
			updatePanelContext({ id, getRecord: () => (record) });
			if(props.events.onRecordChange){
				props.events.onRecordChange.bind({ panel: props, context, panelsContext, updatePanelContext, ...panelContext })(record);
			}
		}
	}, [record]);

	useEffect(() => {
		if(props.record && props.record !== record){
			setRecord(props.record);
		}
	}, [props.record]);
	
	useEffect(() => {
		if(items?.length){
			let itemsObj = {};
			items.map(i => (
				i.id ? itemsObj[i.id] = i : ''
			));
			updatePanelContext({ id, items: itemsObj });
		}
	}, [items]);

	if(panelContext._status !== PANEL_STATUS_READY) return;

	return (
		<div className={classNames(
			"anacleto-form-container p-0",
			props.isCard ? "flex flex-auto" : props.containerClassName
		)}>
			{props.title && <div className="text-xl font-bold">{props.title}</div>}
			<div
				className={classNames(
					"anacleto-form",
					props.layout === "flex" ? "flex" : "grid formgrid align-content-start",
					props.className
				)}
			>
				{
					React.Children.toArray
					(props.children).filter(c => c ).map(c => (
						React.cloneElement(c, c.type?.type?.name ? {
							record,
							setRecord:
							_setRecord,
							forwardData: props.forwardData,
						} : {})
					))
				}
			</div>
		</div>
	);
}
const MemoForm = React.memo(Form, (prev, next) => {
	return defaultMemoizeFunction(Form.propTypes, prev, next);
});
MemoForm.displayName = "Form";
Form.propTypes = {
	id: PropTypes.string.isRequired,
	updatePanelContext: PropTypes.func,
	record: PropTypes.object,
	setRecord: PropTypes.func,
	forwardData: PropTypes.any,
	panelContext: PropTypes.object.isRequired,
	setIsLoading: PropTypes.func,
	context: PropTypes.object.isRequired,
	className: PropTypes.string,
	containerClassName: PropTypes.string,
	dataModel: PropTypes.string,
	events: PropTypes.object,
	actions: PropTypes.array,
	items: PropTypes.array,
	isCard: PropTypes.bool,
	toggleable: PropTypes.bool,
	layout: PropTypes.oneOf(["grid", "flex"]),
	mode: PropTypes.oneOf([FormMode.INSERT, FormMode.EDIT, FormMode.FREE]),
	script: PropTypes.any,
	sectionMultiple: PropTypes.bool,
	store: PropTypes.string,
	subtype: PropTypes.string,
	title: PropTypes.string,
	children: PropTypes.any,
}
export default MemoForm;