import cloneDeep from 'lodash/cloneDeep';
import request from '@/util/request';
import { BaseAdd } from './baseAdd';
import { Message } from 'element-ui';
import { validPicture } from '@/util/validate';

/** 表单数据 */
const openAdvertsOfflineFormData = () => {
    return {
        processType: 10,
        recordName: '', // 需求名称
        businessDepartment: '', // 业务所属部门-默认带出提交人部门
        demandBackground: '', // 业务背景
        onlinePageAddress: [], // 渠道信息
        // 一级审核人erp
        productDocument: [
            {
                selectedValue: ''
            }
        ]
    };
};

/** 表单验证 */
const openAdvertsOfflineFormRules = () => {
    return {
        recordName: [{ required: true, message: '请输入需求名称', trigger: 'blur' }],
        businessDepartment: [{ required: true, message: '请输入业务所属部门', trigger: 'blur' }],
        onlinePageAddress: [{ required: true, message: '必须填写渠道信息', trigger: 'change' }],
    };
};

/** 渲染结构 */
const openAdvertsFormRenderer = () => {
    return {
        recordName: {
            name: 'recordName',
            label: '需求名称',
            placeholder: '请输入需求名称',
            type: 'input',
            disabled: false,
            inpueType: 'text'
        },
        businessDepartment: {
            name: 'businessDepartment',
            label: '业务所属部门',
            placeholder: '请输入业务所属部门',
            type: 'input',
            disabled: true,
            inpueType: 'text'
        },
        demandBackground: {
            name: 'demandBackground',
            label: '业务背景',
            placeholder: '请输入业务背景',
            type: 'input',
            rows: 4,
            inpueType: 'textarea',
            maxlength: 800
        },
        onlinePageAddress: {
            name: 'onlinePageAddress',
            label: '渠道信息',
            type: 'cardList',
            headerName: '配置元素',
            btnList: [
                {
                    id: 0,
                    label: '添加',
                    type: 'primary',
                    handleClick: () => { }
                },
                {
                    id: 1,
                    label: '删除',
                    type: 'danger',
                    handleClick: () => { }
                }
            ],
            children: []
        },
        productDocument: {
            name: 'productDocument',
            label: '审批流程',
            type: 'card',
            options: [{ head: '一级审批', examine: true, examineList: [] }]
        }
    };
};

/**
 * 渠道信息元素(mode来返回元素的字段，字段rules，字段渲染结构)
 * @param {*} mode filed字段，rules字段检验规则，renderer字段渲染结构
 * @param {*} returnExternalApp 《唤起金融APP支持返回外部APP配置申请》对象
 */
const layerConfigItem = (mode, returnExternalApp = null) => {
    if (mode === 'filed') {
        return {
            channelSource: '',
            appScheme_: {
                appSchemeAndroid: '',
                appSchemeIos: ''
            },
            appName: '',
            appIcon: []
        };
    }

    if (mode === 'rules' && returnExternalApp) {
        return {
            channelSource: [
                {
                    required: true,
                    trigger: 'blur',
                    validator: async (rule, value, callback) => {
                        if (!value) {
                            callback(new Error('渠道来源必填'));
                            return;
                        }
                        if (value.length > 50) {
                            callback(new Error('限制输入：50字符'));
                            return;
                        }
                        // 本地唯一性检验
                        const cloneFormData = cloneDeep(returnExternalApp.vueForm.formData);
                        const duplicates = cloneFormData.onlinePageAddress.filter((item, index) => item.channelSource === value);
                        if (duplicates.length > 1) {
                            callback(new Error('多个配置元素中,渠道来源不允许重复'));
                            return;
                        }
                        // 远程唯一性检验******start
                        const res = await request.channelItemCheck({
                            method: 'GET',
                            resultLevel: 1,
                            params: {
                                context: value,
                                flag: "channelSource"
                            }
                        });
                        if (res.code !== 200) {
                            callback(new Error(res.msg || '唯一性检查不通过'));
                            return;
                        }
                        // 远程唯一性检验******end
                        callback();
                    }
                }
            ],
            appScheme_: [{
                required: true,
            }],
            "appScheme_.appSchemeAndroid": [
                {
                    trigger: 'blur',
                    validator: async (rule, value, callback) => {
                        const str = rule.field;
                        const regex = /\d+/;
                        const match = str.match(regex);
                        const cloneFormData = cloneDeep(returnExternalApp.vueForm.formData);
                        if (value) {
                            // 验证协议格式
                            if (!value.includes("//")) {
                                callback(new Error('请输入标准协议链接，如：snssdk1128://等'));
                                return;
                            }
                            // 本地验证唯一性
                            if (match) {
                                const duplicates = cloneFormData.onlinePageAddress.filter((item, index) => item.appScheme_.appSchemeAndroid === value);
                                if (duplicates.length > 1) {
                                    callback(new Error('本地表单配置元素对比：AndroidScheme不许重复'));
                                    return;
                                }
                            }
                            // 远程唯一性检验******start
                            const res = await request.channelItemCheck({
                                method: 'GET',
                                resultLevel: 1,
                                params: {
                                    context: value,
                                    flag: "androidScheme"
                                }
                            });
                            if (res.code !== 200) {
                                callback(new Error(res.msg || '唯一性检查不通过'));
                                return;
                            }
                            // 远程唯一性检验******end

                            // 如果iosScheme输入框是空字符串， 主动触发检验，（如果是曝红状态，通过检验可以把它变为正常状态）
                            if (match) {
                                const index = match[0]
                                if (!cloneFormData.onlinePageAddress[index].appScheme_.appSchemeIos) {
                                    const field = rule.field.replace("appSchemeAndroid", "appSchemeIos")
                                    returnExternalApp.vueForm.$refs.form.validateField(field);
                                }
                            }
                        } else {
                            // 至少要输入一端
                            if (match) {
                                const index = match[0]
                                if (!cloneFormData.onlinePageAddress[index].appScheme_.appSchemeIos) {
                                    callback(new Error('至少输入一端的第三方AppScheme,如若相同请复制输入'));
                                    return;
                                }
                            }
                        }
                        callback();
                    }
                }
            ],
            "appScheme_.appSchemeIos": [
                {
                    trigger: 'blur',
                    validator: async (rule, value, callback) => {
                        const str = rule.field;
                        const regex = /\d+/;
                        const match = str.match(regex);
                        const cloneFormData = cloneDeep(returnExternalApp.vueForm.formData);
                        if (value) {
                            // 验证协议格式
                            if (!value.includes("//")) {
                                callback(new Error('请输入标准协议链接，如：snssdk1128://等'));
                                return;
                            }
                            // 本地验证唯一性
                            if (match) {
                                const index = match[0]
                                const duplicates = cloneFormData.onlinePageAddress.filter((item, index) => item.appScheme_.appSchemeIos === value);
                                if (duplicates.length > 1) {
                                    callback(new Error('本地表单配置元素对比：iosScheme不许重复'));
                                    return;
                                }
                            }
                            // 远程唯一性检验******start
                            const res = await request.channelItemCheck({
                                method: 'GET',
                                resultLevel: 1,
                                params: {
                                    context: value,
                                    flag: "iosScheme"
                                }
                            });
                            if (res.code !== 200) {
                                callback(new Error(res.msg || '唯一性检查不通过'));
                                return;
                            }
                            // 远程唯一性检验******end

                            // 如果androidScheme输入框是空字符串， 主动触发检验，（如果是曝红状态，通过检验可以把它变为正常状态）
                            if (match) {
                                const index = match[0]
                                if (!cloneFormData.onlinePageAddress[index].appScheme_.appSchemeAndroid) {
                                    const field = rule.field.replace("appSchemeIos", "appSchemeAndroid")
                                    returnExternalApp.vueForm.$refs.form.validateField(field);
                                }
                            }
                        } else {
                            // 至少要输入一端
                            if (match) {
                                const index = match[0]
                                if (!cloneFormData.onlinePageAddress[index].appScheme_.appSchemeAndroid) {
                                    callback(new Error('至少输入一端的第三方AppScheme,如若相同请复制输入'));
                                    return;
                                }
                            }
                        }
                        callback();
                    }
                }
            ],
            appName: [
                {
                    required: true,
                    trigger: 'blur',
                    validator: async (rule, value, callback) => {
                        if (!value) {
                            callback(new Error('AppName必填'));
                            return;
                        } else {
                            if (value.length > 10) {
                                callback(new Error('限制输入：10字符'));
                                return;
                            }
                            const cloneFormData = cloneDeep(returnExternalApp.vueForm.formData);
                            // 本地唯一性检验
                            const duplicates = cloneFormData.onlinePageAddress.filter((item, index) => item.appName === value);
                            if (duplicates.length > 1) {
                                callback(new Error('多个配置元素中,appName不允许重复'));
                                return;
                            }

                            // 远程唯一性检验******start
                            const res = await request.channelItemCheck({
                                method: 'GET',
                                resultLevel: 1,
                                params: {
                                    context: value,
                                    flag: "appName"
                                }
                            });
                            if (res.code !== 200) {
                                callback(new Error(res.msg || '唯一性检查不通过'));
                                return;
                            }
                            // 远程唯一性检验******end
                        }
                        callback();
                    }
                }
            ],
            appIcon: [{ required: true, message: '图标必要', trigger: 'change' }],
        };
    }
    if (mode === 'renderer') {
        return {
            channelSource: {
                name: 'channelSource',
                label: '渠道来源',
                placeholder: '请输入第三方渠道来源 (source) 用来标识当前渠道信息',
                type: 'input',
                disabled: false,
                inpueType: 'text',
                maxlength: 50
            },
            appScheme_: {
                name: 'appScheme_',
                label: 'APP Scheme：',
                des: '第三方AppScheme，用于客户端做对比使用，如若相同请复制输入',
                type: 'object',
                keys: {
                    appSchemeAndroid: {
                        name: 'appSchemeAndroid',
                        label: 'Android',
                        placeholder: '请输入Android端 AppScheme，如: snssdk1128://',
                        type: 'input',
                        disabled: false,
                        inpueType: 'text'
                    },
                    appSchemeIos: {
                        name: 'appSchemeIos',
                        label: 'IOS',
                        placeholder: '请输入iOS端 AppScheme，如: snssdk1128://',
                        type: 'input',
                        disabled: false,
                        inpueType: 'text'
                    },
                }
            },
            appName: {
                name: 'appName',
                label: 'App Name',
                placeholder: '请输入第三方App名称',
                type: 'input',
                disabled: false,
                inpueType: 'text',
                maxlength: 10
            },
            appIcon: {
                name: 'appIcon',
                label: 'App icon',
                placeholder: '请上传第三方App icon ，要求: 正方形，JPG/PNG，文件大小不超过50K',
                listType: 'picture-card',
                limit: 1,
                maxFileSize: 0.049,
                typeValidationMethod: fileName => {
                    return validPicture(fileName);
                },
                disabled: false,
                type: 'upload',
                fileList: [],
                setFileList(list) {
                    this.fileList = list;
                }
            },

        };
    }
};

export class ReturnExternalApp extends BaseAdd {
    constructor(props = {}, vueForm) {
        super();
        this.props = props;
        this.vueForm = vueForm;
        this.init();
    }

    async init() {
        const formData = openAdvertsOfflineFormData();
        const fieldMap = openAdvertsFormRenderer();
        const rules = openAdvertsOfflineFormRules();
        fieldMap.onlinePageAddress.btnList[0].handleClick = this.addConfig.bind(this);
        fieldMap.onlinePageAddress.btnList[1].handleClick = this.deleteConfig.bind(this);

        formData.onlinePageAddress = [layerConfigItem('filed')];
        this.generateLayerConfigRules(formData, rules);
        fieldMap.onlinePageAddress.children = [layerConfigItem('renderer')];

        const res1 = await this.getUserOrganization();
        formData.businessDepartment = res1.organization;
        const examineOne = await this.getConfigSigle(1, 10, 0);
        fieldMap.productDocument.options[0].examineList = examineOne.map(item => ({
            value: item.erp,
            label: item.name
        }));
        formData.productDocument[0].selectedValue = fieldMap.productDocument.options[0].examineList[0].value;

        this.vueForm.init({ formData, rules, fieldMap });
    }

    /**
     * 添加渠道配置
     * @param {*} index 渠道配置索引
     */
    addConfig(index) {
        const cloneFormData = cloneDeep(this.vueForm.formData);
        const cloneRules = cloneDeep(this.vueForm.rules);
        const cloneFieldMap = cloneDeep(this.vueForm.fieldMap);
        cloneFormData.onlinePageAddress.splice(index + 1, 0, layerConfigItem('filed'));
        this.generateLayerConfigRules(cloneFormData, cloneRules);
        cloneFieldMap.onlinePageAddress.children.splice(index + 1, 0, layerConfigItem('renderer'));
        this.vueForm.init({ fieldMap: cloneFieldMap, rules: cloneRules, formData: cloneFormData });
    }

    /**
     * 删除渠道配置
     * @param {*} index 渠道配置索引
     */
    deleteConfig(index) {
        const cloneFormData = cloneDeep(this.vueForm.formData);
        const cloneRules = cloneDeep(this.vueForm.rules);
        const cloneFieldMap = cloneDeep(this.vueForm.fieldMap);
        if (cloneFormData.onlinePageAddress.length <= 1) {
            Message({
                message: '至少得包含一个配置元素！',
                type: 'error'
            });
            return;
        }
        cloneFormData.onlinePageAddress.splice(index, 1);
        this.generateLayerConfigRules(cloneFormData, cloneRules);
        cloneFieldMap.onlinePageAddress.children.splice(index, 1);
        this.vueForm.init({ fieldMap: cloneFieldMap, rules: cloneRules, formData: cloneFormData });
    }

    /** 生成渠道配置Rules */
    generateLayerConfigRules(formData, rules) {
        for (let i = 0; i < formData.onlinePageAddress.length; i++) {
            rules[`onlinePageAddress${i}`] = layerConfigItem('rules', this);
        }
    }

    async onSubmit() {
        const formData = cloneDeep(this.vueForm.formData);
        formData.requirementName = formData.recordName
        formData.auditFirstErp = formData.productDocument[0].selectedValue;
        delete formData.productDocument;
        formData.onlinePageAddress = JSON.stringify(
            formData.onlinePageAddress.map(item => {
                return {
                    channelSource: item.channelSource,
                    appName: item.appName,
                    appIcon: item.appIcon[0],
                    ...(item.appScheme_),
                };
            })
        );

        console.log("要提交的表单数据：", formData)
        await request.addwhitenotic({
            data: formData,
            isShowLoading: true
        });
    }
}