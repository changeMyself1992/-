import {
  experienceProblemForm,
  experienceProblemFormRules,
  experienceProblemFormRenderer,
  getProblemTypeFromId,
  logUser,
  getProductNameFormProductModule,
  progressForm,
  progressFormRenderer,
  progressFormRules,
  progressType,
  resolveExperienceProblemForm,
  resolveExperienceProblemFormRules,
  resolveExperienceProblemFormRenderer,
  priorityType,
  searchFormRenderer,
  searchForm,
  problemType,
  productModule,
  businessType,
  feedbackDataSearchFormRenderer,
  feedbackDataSearchForm
} from './field-name-list.js';
import request from '@/util/request';
import cloneDeep from 'lodash/cloneDeep';

// 这个文件里的类主要集成以下功能
// 1. 为common-form组件提供，渲染结构fieldMap，表单数据formData，表单验证rules，
// 2. 以及提供操作这些数据的方法（因为表单结构可能会动态变化，相应的就要动态的改 渲染结构fieldMap，表单数据formData，表单验证rules）
// 3. 执行提交表单的具体逻辑

/** 用于搜索反馈列表 */
export class SearchForm {
  /**
   * 搜索表单构造函数
   * @param {*} props 要求是一个对象，可以定义很多认为在类的内部有用的字段
   * @param {*} vueForm common-form组件的引用
   */
  constructor(
    props = {
      type: ''
    },
    vueForm
  ) {
    this.props = props;
    this.vueForm = vueForm;
    this.handleBusinessLineSelectionLogic = this.businessLineSelectionLogic.bind(this);
    this.init();
  }

  async init() {
    const { type } = this.props;
    const fieldMap = searchFormRenderer(type);
    fieldMap.progresses.options.list = progressType(type);
    fieldMap.productModuleGroupId.selectionLogic = this.handleBusinessLineSelectionLogic;
    fieldMap.productModuleGroupId.options.list = businessType.businessType;
    const formData = searchForm(type);
    formData.productModuleGroupId = 1;
    if (type === 'all') {
      fieldMap.productModuleIds.options = productModule[1];
      fieldMap.problemTypeIds.options = problemType[1];
    }
    if (type === 'haveDeal') {
      formData.follower = logUser.userErp;
      fieldMap.progresses.options.list.forEach(item => {
        formData.progresses.push(item.value);
      });
      fieldMap.problemTypeIds.options = problemType[1];
    }
    if (type === 'waitDeal') {
      formData.follower = logUser.userErp;
      fieldMap.progresses.options.list.forEach(item => {
        formData.progresses.push(item.value);
      });
      fieldMap.problemTypeIds.options = problemType[1];
    }

    this.vueForm.init({ formData, rules: {}, fieldMap });
  }

  /** 业务线选择后的逻辑 */
  async businessLineSelectionLogic(value) {
    const cloneFormData = cloneDeep(this.vueForm.formData);
    const cloneFieldMap = cloneDeep(this.vueForm.fieldMap);
    cloneFormData.productModuleIds = [];
    cloneFormData.problemTypeIds = [];

    const { type } = this.props;
    if (type === 'all') {
      cloneFieldMap.productModuleIds.options = productModule[cloneFormData.productModuleGroupId];
      cloneFieldMap.problemTypeIds.options = problemType[cloneFormData.productModuleGroupId];
    }
    if (type === 'haveDeal') {
      cloneFieldMap.problemTypeIds.options = problemType[cloneFormData.productModuleGroupId];
    }
    if (type === 'waitDeal') {
      cloneFieldMap.problemTypeIds.options = problemType[cloneFormData.productModuleGroupId];
    }

    this.vueForm.init({ formData: cloneFormData, rules: {}, fieldMap: cloneFieldMap });
  }
}

/** 新增，编辑,体验问题 */
export class ExperienceProblem {
  constructor(
    props = {
      mode: 'add', // 创建体验问题模态框的模式，add添加，edit编辑
      id: '', // 体验问题id
      feedbackDetailData: 0 // 体验问题詳情
    },
    vueForm
  ) {
    this.props = props;
    this.vueForm = vueForm;
    this.handleBusinessLineSelectionLogic = this.businessSelectionLogic.bind(this);
    // this.handleStagedSelectionLogic = this.selectionLogic.bind(this);
    this.init();
  }

  async init() {
    let fieldMap = experienceProblemFormRenderer();
    fieldMap.productModuleGroupId.selectionLogic = this.handleBusinessLineSelectionLogic;
    fieldMap.productModuleGroupId.options.list = businessType.businessType;

    let rules = experienceProblemFormRules();
    let formData = experienceProblemForm();

    const { mode } = this.props;
    if (mode === 'add') {
      formData.submitter = logUser.userErp;
      // 添加的时候业务线模块默认为金融app
      formData.productModuleGroupId = 1;
      fieldMap.产品模块_.options = productModule[1];
      fieldMap.问题类型_.options = problemType[1];
    } else if (mode === 'edit') {
      const {
        feedbackDetailData: { screenshots, problemTypeId, problemSubtypeId, productModuleId, productSubmoduleId, progress, productModuleGroupId }
      } = this.props;
      // 状态类型不是待评估，并且不是已完成, 要求增加额外的编辑元素，预计修复时间&cf地址&解决方案
      if (progress !== 0 && progress !== 5) {
        const extraMap = resolveExperienceProblemFormRenderer();
        delete extraMap.priority;
        fieldMap = Object.assign(fieldMap, extraMap);

        const extraRules = cloneDeep(resolveExperienceProblemFormRules);
        delete extraRules.priority;
        rules = Object.assign(rules, extraRules);

        const extraFormData = resolveExperienceProblemForm();
        delete extraFormData.priority;
        formData = Object.assign(formData, extraFormData);
      }
      // 給表单赋值
      Object.keys(formData).forEach(key => {
        if (key === 'screenshots') {
          if (screenshots) {
            const urlArray = screenshots.split(';');
            formData[key] = urlArray;
            const fileList = urlArray.map((url, index) => {
              return {
                name: `default-${index}.${this.getFileType(url)}`,
                url,
                uid: index,
                status: 'success'
              };
            });
            fieldMap.screenshots.setFileList(fileList);
          }
        } else if (key === '问题类型_') {
          // 一级问题节点不等于0代表是有意义的，该问题类型确实存在子父级
          if (problemTypeId !== 0) {
            formData[key] = [problemTypeId, problemSubtypeId];
          } else {
            formData[key] = [problemSubtypeId];
          }
        } else if (key === '产品模块_') {
          // 产品模块一级节点不等于0代表是有意义的，该产品模块确实存在子父级
          if (productModuleId !== 0) {
            formData[key] = [productModuleId, productSubmoduleId];
          } else {
            formData[key] = [productSubmoduleId];
          }
        } else {
          formData[key] = this.props.feedbackDetailData[key];
        }
      });
      fieldMap.产品模块_.options = productModule[String(productModuleGroupId)];
      fieldMap.问题类型_.options = problemType[String(productModuleGroupId)];
    }
    this.vueForm.init({ formData, rules, fieldMap });
  }

  /** 业务线选择后的逻辑 */
  async businessSelectionLogic(value, item) {
    const cloneFormData = cloneDeep(this.vueForm.formData);
    cloneFormData.产品模块_ = [];
    cloneFormData.问题类型_ = [];

    const cloneRules = cloneDeep(this.vueForm.rules);
    const cloneFieldMap = cloneDeep(this.vueForm.fieldMap);

    cloneFieldMap.产品模块_.options = productModule[cloneFormData.productModuleGroupId];
    cloneFieldMap.问题类型_.options = problemType[cloneFormData.productModuleGroupId];

    this.vueForm.init({ formData: cloneFormData, rules: cloneRules, fieldMap: cloneFieldMap });
  }

  getFileType(linksStr) {
    if (typeof linksStr === 'string') {
      // 无参数的url
      const url = linksStr.split('?')[0];
      if (url) {
        const array = url.split('.');
        if (array && array.length > 0) {
          return array[array.length - 1];
        }
      }
    }
    return '';
  }

  async handleSubmit() {
    const form = cloneDeep(this.vueForm.formData);

    if (Array.isArray(form.screenshots)) {
      form.screenshots = form.screenshots.join(';');
    }

    form.productModuleId = Number(form.产品模块_[0]);
    form.productSubmoduleId = Number(form.产品模块_[1]);
    delete form.产品模块_;

    const problemTypeItem = getProblemTypeFromId(form.问题类型_[form.问题类型_.length - 1], form.productModuleGroupId);
    form.problemTypeId = Number(problemTypeItem.parentId);
    form.problemSubtypeId = Number(problemTypeItem.id);
    delete form.问题类型_;

    const { mode, id } = this.props;
    if (mode === 'add') {
      console.log('添加问题反馈表单提交:', form);
      await request.feedbackAdd({
        data: form,
        isShowLoading: true
      });
    } else if (mode === 'edit') {
      console.log('编辑问题反馈表单提交:', form);
      await request.feedbackModify({
        data: {
          ...form,
          id
        },
        isShowLoading: true
      });
    }
  }
}

/** 更改反馈进度 */
export class Progress {
  constructor(
    props = {
      id: ''
    },
    vueForm
  ) {
    this.props = props;
    this.vueForm = vueForm;
    this.init();
  }

  init() {
    const fieldMap = progressFormRenderer();
    fieldMap.progress.options.list = progressType();
    const rules = progressFormRules;
    const formData = progressForm();
    this.vueForm.init({ formData, rules, fieldMap });
  }

  async handleSubmit() {
    const { id } = this.props;
    const form = cloneDeep(this.vueForm.formData);
    await request.feedbackModify({
      data: {
        ...form,
        id
      },
      isShowLoading: true
    });
  }
}

/** 处理体验问题 */
export class ResolveExperienceProblem {
  constructor(
    props = {
      id: '',
      buttonType: '',
      priority: 0
    },
    vueForm
  ) {
    this.props = props;
    this.vueForm = vueForm;
    this.init();
  }

  init() {
    const fieldMap = resolveExperienceProblemFormRenderer();
    fieldMap.priority.options.list = priorityType;
    const rules = resolveExperienceProblemFormRules;
    const formData = resolveExperienceProblemForm();
    formData.priority = this.props.priority

    this.vueForm.init({ formData, rules, fieldMap });
  }

  async handleSubmit() {
    const { id, buttonType } = this.props;
    const form = cloneDeep(this.vueForm.formData);
    await request.feedbackModify({
      data: {
        ...form,
        id
      },
      isShowLoading: true
    });
    await request.feedbackHandle({
      data: {
        id,
        buttonType: buttonType
      },
      isShowLoading: true
    });
  }
}

/** 数据趋势 表单搜索 */
export class SearchFormFeedbackData {
  /**
   * 搜索表单构造函数
   * @param {*} props 要求是一个对象，可以定义很多认为在类的内部有用的字段
   * @param {*} vueForm common-form组件的引用
   */
  constructor(
    props = {

    },
    vueForm
  ) {
    this.props = props;
    this.vueForm = vueForm;
    this.init();
  }

  async init() {
    const { type } = this.props;
    const fieldMap = feedbackDataSearchFormRenderer();
    fieldMap.productModuleGroupId.options.list = businessType.businessType;
    const formData = feedbackDataSearchForm();
    formData.productModuleGroupId = 1;
    this.vueForm.init({ formData, rules: {}, fieldMap });
  }
}
