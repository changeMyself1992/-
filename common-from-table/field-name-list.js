import cloneDeep from 'lodash/cloneDeep';
import { validAudio, validPicture, validPdf } from '@/util/validate';
import moment from 'moment';
/** 问题类型 */
export const problemType = {};

/** 产品模块 */
export const productModule = {};

/** 业务线类型 */
export const businessType = {
  businessType: []
};

/** 处理优先级 */
export const priorityType = [
  { label: '低', value: 0 },
  { label: '中', value: 1 },
  { label: '高', value: 2 }
];

export const logUser = {
  userErp: ''
};

/** 根据id查找业务线名称 */
export const findBusinessItem = (productModuleGroupId = 1) => {
  const businessItem = businessType.businessType.find(item => {
    return item.id === productModuleGroupId;
  });
  return businessItem && businessItem.modelGroupName;
};

/**
 * 查找问题元素
 * @param {*} id  问题类型id
 * @param {*} productModuleGroupId 业务线id
 * @returns
 */
export const getProblemTypeFromId = (id, productModuleGroupId) => {
  let problemTypeItem = {};
  function fun1(array) {
    for (let i = 0; i < array.length; i++) {
      const element = array[i];
      if (Number(element.id) === Number(id)) {
        problemTypeItem = element;
      }
      if (element.children && element.children.length) {
        fun1(element.children);
      }
    }
  }
  fun1(problemType[productModuleGroupId]);
  return problemTypeItem;
};

/**
 * 根据问题类型id数据，获取对应得问题节点名称
 * @param {*} idArray 问题类型父id子id
 * @param {*} productModuleGroupId 业务线类型id
 * @returns
 */
export const getProblemNameFormProblemModule = (idArray, productModuleGroupId) => {
  let tempArray = cloneDeep(problemType[productModuleGroupId]);
  let str = '';
  function fun1(array, id) {
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (item.id === id) {
        if (Object.keys(item).includes('children') && item.children.length > 0) {
          str += item.problemname;
          return item.children || [];
        } else {
          str += ` / ${item.problemname}`;
          return [];
        }
      }
    }
    return [];
  }
  for (let i = 0; i < idArray.length; i++) {
    const id = idArray[i];
    tempArray = fun1(tempArray, id);
  }
  return str;
};

/** 根据产品模块数据，获取相关人员erp  */
export const getFunctionaryErpFormProductModule = (productIdArray, productModuleGroupId) => {
  let tempArray = cloneDeep(productModule[productModuleGroupId]);
  const obj = {};
  function fun1(array, id) {
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (item.value === id) {
        if (Object.keys(item).includes('children') && item.children.length > 0) {
          return item.children;
        } else if (Object.keys(item).includes('operator') && Object.keys(item).includes('follower')) {
          obj.operator = item.operator;
          obj.follower = item.follower;
        }
      }
    }
  }
  for (let i = 0; i < productIdArray.length; i++) {
    const id = productIdArray[i];
    tempArray = fun1(tempArray, id);
  }
  return obj;
};

/** 根据产品模块数据，获取对应得产品节点名称 */
export const getProductNameFormProductModule = (productIdArray, productModuleGroupId) => {
  productIdArray = productIdArray.filter(id => {
    // id为0代表没有意义所以要过滤掉
    return id !== 0;
  });
  let tempArray = cloneDeep(productModule[productModuleGroupId]);
  let str = '';
  function fun1(array, id) {
    for (let i = 0; i < array.length; i++) {
      const item = array[i];
      if (item.id === id) {
        if (Object.keys(item).includes('children') && item.children.length > 0) {
          str += str ? ` / ${item.modelName}` : item.modelName;
          return item.children;
        } else {
          str += str ? ` / ${item.modelName}` : item.modelName;
          return [];
        }
      }
    }
    return [];
  }
  for (let i = 0; i < productIdArray.length; i++) {
    const id = productIdArray[i];
    tempArray = fun1(tempArray, id);
  }
  return str;
};

/**
 * 反馈列表搜索 表单数据
 * @param {*} type 反馈列表的查看方式 all(全部的反馈)，waitDeal(等待我处理的反馈)，haveDeal(我已处理的反馈)
 */
export const searchForm = (type = 'all') => {
  const obj = {
    describe: '',
    submitter: '',
    follower: '',
    productModuleGroupId: '',
    productModuleIds: [],
    problemTypeIds: [],
    progresses: [],
    创建时间范围_: []
  };
  // if (type === "all") {
  // }
  if (type === 'waitDeal') {
    delete obj.productModuleIds;
  }
  if (type === 'haveDeal') {
    delete obj.productModuleIds;
  }
  return obj;
};

/**
 * 搜索表单渲染数据结构
 * @param {*} type 反馈列表的查看方式 all(全部的反馈)，waitDeal(等待我处理的反馈)，haveDeal(我已处理的反馈)
 */
export const searchFormRenderer = (type = 'all') => {
  const obj = {
    describe: {
      name: 'describe',
      label: '问题描述',
      placeholder: '请输入问题描述关键词',
      type: 'input',
      inpueType: 'text'
    },
    submitter: {
      name: 'submitter',
      label: '提交人',
      placeholder: '请输入提交人erp',
      type: 'findErp'
    },
    follower: {
      name: 'follower',
      label: '跟进人',
      placeholder: '请输入跟进人erp',
      type: 'findErp'
    },

    productModuleGroupId: {
      name: 'productModuleGroupId',
      label: '业务线类型',
      placeholder: '请选择',
      type: 'select',
      multiple: false,
      options: {
        list: []
      },
      selectionLogic: () => {} // 选择业务线之后执行的逻辑
    },

    productModuleIds: {
      name: 'productModuleIds',
      label: '产品模块',
      placeholder: '请选择',
      type: 'cascader',
      multiple: true,
      options: []
    },
    problemTypeIds: {
      name: 'problemTypeIds',
      label: '问题类型',
      type: 'cascader',
      multiple: true,
      options: []
    },
    progresses: {
      name: 'progresses',
      label: '反馈进度',
      type: 'select',
      multiple: true,
      options: {
        list: []
      },
      disabled: false
    },
    创建时间范围_: {
      name: '创建时间范围_',
      label: '创建时间范围',
      type: 'time',
      timeType: 'datetimerange',
      pickerOptions: {
        shortcuts: [
          {
            text: '最近7天',
            onClick(picker) {
              picker.$emit('pick', [moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')]);
            }
          },
          {
            text: '最近30天',
            onClick(picker) {
              picker.$emit('pick', [moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')]);
            }
          },
          {
            text: '最近90天',
            onClick(picker) {
              picker.$emit('pick', [moment().subtract(90, 'days').format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')]);
            }
          }
        ]
      }
    }
  };
  const follower = {
    name: 'follower',
    label: '跟进人',
    placeholder: '请输入跟进人erp',
    type: 'input',
    inpueType: 'text',
    disabled: true
  };
  // if (type === "all") {
  // }
  if (type === 'waitDeal') {
    delete obj.productModuleIds;
    obj.follower = follower;
  }
  if (type === 'haveDeal') {
    delete obj.productModuleIds;
    obj.follower = follower;
    // obj.progresses.disabled = true;
  }
  return obj;
};

/** 体验问题反馈，提交时的表单数据结构 */
export const experienceProblemForm = () => {
  return {
    submitter: '',
    version: '',
    productModuleGroupId: '',
    问题类型_: [],
    产品模块_: [],
    follower: '',
    operator: '',
    priority: 0,
    describe: '',
    screenshots: [],
    advice: '',
    remark: ''
  };
};

/** 体验问题反馈，表单Rule */
export const experienceProblemFormRules = () => {
  return {
    submitter: [{ required: true, message: '请输入提交人erp', trigger: 'change' }],
    productModuleGroupId: [{ required: true, message: '请选择业务线', trigger: 'change' }],
    问题类型_: [{ required: true, message: '请选择问题类型', trigger: 'change' }],
    产品模块_: [
      {
        validator: (rule, value, callback) => {
          if (Array.isArray(value) && value.length === 0) {
            callback(new Error('请选择产品模块'));
          } else {
            callback();
          }
        },
        required: true,
        message: '请选择产品模块',
        trigger: 'change'
      }
    ],
    follower: [{ required: true, message: '选择产品模块后自动获取跟进人', trigger: 'change' }],
    operator: [{ required: true, message: '选择产品模块后自动获取负责人', trigger: 'change' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
    describe: [{ required: true, message: '请输入问题描述', trigger: 'change' }],
    advice: [{ required: true, message: '请输入优化建议', trigger: 'change' }]
  };
};

/** 体验问题反馈，表单渲染数据结构 */
export const experienceProblemFormRenderer = () => {
  return {
    submitter: {
      name: 'submitter',
      label: '提交人',
      placeholder: '请输入提交人erp',
      type: 'input',
      disabled: true,
      inpueType: 'text'
    },
    version: {
      name: 'version',
      label: '版本号',
      placeholder: '请输入版本号',
      type: 'input',
      inpueType: 'text',
      maxlength: 20
    },
    productModuleGroupId: {
      name: 'productModuleGroupId',
      label: '业务线类型',
      type: 'select',
      multiple: false,
      options: {
        list: []
      },
      disabled: false,
      selectionLogic: () => {}, // 选择业务线之后执行的逻辑
      desc: '必须先选择业务线类型，才能继续选择问题类型和产品模块'
    },
    问题类型_: {
      name: '问题类型_',
      label: '问题类型',
      type: 'cascader',
      options: []
    },
    产品模块_: {
      name: '产品模块_',
      label: '产品模块',
      placeholder: '请选择',
      type: 'cascader',
      options: [],
      bindKeys: ['follower', 'operator'], // 该表单元素发生改变后，跟它绑定的  相关表单字段也要更新数据
      getFunctionaryErpFormProductModule, // 根据产品模块数据获取负责人erp
      selectionLogic: () => {} // 选择分期产品模块后的逻辑
    },
    follower: {
      name: 'follower',
      label: '跟进人',
      placeholder: '跟进人erp',
      type: 'findErp',
      disabled: false,
      inpueType: 'text'
    },
    operator: {
      name: 'operator',
      label: '负责人',
      placeholder: '跟进人的leader',
      type: 'findErp',
      disabled: false,
      inpueType: 'text'
    },
    priority: {
      name: 'priority',
      label: '优先级',
      type: 'select',
      multiple: false,
      options: {
        list: priorityType
      },
      disabled: false
    },

    describe: {
      name: 'describe',
      label: '问题描述',
      placeholder: '请输入问题描述',
      type: 'input',
      rows: 4,
      inpueType: 'textarea',
      maxlength: 500
    },
    screenshots: {
      name: 'screenshots',
      label: '问题截图录屏',
      placeholder: '只允许上传图片，视频，pdf,大小限制8M以内，最多上传8个文件；',
      limit: 8,
      maxFileSize: 8,
      typeValidationMethod: fileName => {
        return validAudio(fileName) || validPicture(fileName) || validPdf(fileName);
      },
      disabled: false,
      type: 'upload',
      fileList: [],
      setFileList(list) {
        this.fileList = list;
      }
    },
    advice: {
      name: 'advice',
      label: '优化建议',
      placeholder: '请输入优化建议',
      type: 'input',
      rows: 4,
      inpueType: 'textarea',
      maxlength: 500
    },
    remark: {
      name: 'remark',
      label: '备注',
      placeholder: '请输入备注',
      type: 'input',
      rows: 4,
      inpueType: 'textarea',
      maxlength: 500
    }
  };
};

/**
 * 反馈进度
 * @param {*} type 反馈列表的查看方式 all(全部的反馈)，waitDeal(等待我处理的反馈)，haveDeal(我已处理的反馈)
 */
export const progressType = (type = 'all') => {
  const array = [
    { label: '待评估', value: 0 },
    { label: '待排期', value: 1 },
    { label: '优化中', value: 2 },
    { label: '灰度', value: 3 },
    { label: '暂停', value: 4 },
    { label: '已完成', value: 5 },
    { label: '无需处理', value: 6 }
  ];
  // if (type === "all") {
  // }
  if (type === 'waitDeal') {
    return array.filter(item => {
      return item.value !== 5 && item.value !== 6;
    });
  }
  if (type === 'haveDeal') {
    return array.filter(item => {
      return item.value === 5 || item.value === 6;
    });
  }
  return array;
};

/** 反馈列表 表格展示 */
export const feedbackFields = type => {
  return [
    { key: 'id', label: 'id', type: 'default' },
    { key: 'submitTime', label: '创建时间', type: 'default', width: '160px' },
    { key: 'version', label: '版本号', type: 'default' },
    { key: 'submitter', label: '提交人erp', type: 'timline', width: '120px' },
    { key: 'follower', label: '跟进人erp', type: 'timline', width: '120px' },
    { key: 'operator', label: '负责人erp', type: 'timline', width: '120px' },
    {
      key: 'progress',
      label: '反馈进度',
      type: 'default',
      // 处理反馈进度的展示，把int值转换为对应的文案
      processingShow: row => {
        const { progress } = row;
        return (
          progressType().find(item => {
            return progress === Number(item.value);
          })?.label || ''
        );
      }
    },
    {
      key: 'priority',
      label: '优先级',
      type: 'default',
      processingShow: row => {
        const { priority } = row;
        if (priority === -1) return '低';
        return priorityType.find(item => {
          return priority === Number(item.value);
        }).label;
      }
    },
    { key: 'screenshots', label: '问题截图录屏', type: 'fileShow', width: '120px' },
    { key: 'describe', label: '问题描述', type: 'desc', width: '200px' },
    { key: 'remark', label: '问题备注', type: 'desc', width: '200px' },
    { key: 'advice', label: '优化建议', type: 'desc', width: '200px' },
    { key: 'solution', label: '解决方案', type: 'desc', width: '200px' },
    { key: 'solutionCfUrl', label: '方案cf地址', type: 'autoGenerateType', width: '200px' },
    { key: 'repairTime', label: '预期修复时间', type: 'default', width: '160px' },
    { key: 'reminderTime', label: '最后催办时间', type: 'default', width: '160px' },
    {
      key: 'productModuleGroupId',
      label: '业务线类型',
      type: 'default',
      width: '150px',
      processingShow: row => {
        const { productModuleGroupId = 1 } = row;
        return findBusinessItem(productModuleGroupId);
      }
    },
    {
      key: 'problemName',
      label: '问题类型',
      type: 'default',
      width: '130px',
      processingShow: row => {
        const { problemTypeId, problemSubtypeId, productModuleGroupId = 1 } = row;
        // problemTypeId问题一级类型id，problemSubtypeId问题二级类型id
        // 问题一级类型id 为0，代表没有意义，productSubmoduleId就是问题类型id，非0得情况代表问题类型存在多级的情况
        return getProblemNameFormProblemModule(problemTypeId === 0 ? [problemSubtypeId] : [problemTypeId, problemSubtypeId], productModuleGroupId);
      }
    },
    {
      key: 'producName',
      label: '产品模块',
      type: 'default',
      width: '130px',
      processingShow: row => {
        // productModuleId产品一级模块 id,productSubmoduleId产品二级模块 id
        const { productModuleId, productSubmoduleId, productModuleGroupId = 1 } = row;
        return getProductNameFormProductModule([productModuleId, productSubmoduleId], productModuleGroupId);
      }
    },
    {
      key: 'operation',
      fixed: 'right',
      label: '操作',
      type: 'btnBox',
      btnList: [
        {
          id: 0,
          label: '查看',
          type: 'text',
          qdReport: {
            clstag: type === 'all' ? 'V3E6|55480' : type === 'haveDeal' ? 'VJ83|55482' : 'K583|55484',
            ext: {
              serid: ''
            }
          },
          handleClick: () => {}
        }
      ]
    }
  ];
};

/** 问题反馈 详情展示的渲染结构 */
export const feedbackDetailFields = () => {
  return [
    { name: 'version', label: '版本号', type: 'normal', icon: 'el-icon-link' },
    { name: 'submitter', label: '提交人erp', type: 'normal', icon: 'el-icon-link' },
    { name: 'follower', label: '跟进人erp', type: 'normal', icon: 'el-icon-link' },
    { name: 'operator', label: '负责人erp', type: 'normal', icon: 'el-icon-link' },
    {
      name: 'progress',
      label: '反馈进度',
      type: 'normal',
      icon: 'el-icon-link',
      // 处理反馈进度的展示，把int值转换为对应的文案
      processingShow: value => {
        return (
          progressType().find(item => {
            return value === Number(item.value);
          })?.label || ''
        );
      }
    },
    {
      name: 'priority',
      label: '优先级',
      type: 'normal',
      icon: 'el-icon-link',
      processingShow: priority => {
        if (priority === -1) return '低';
        return priorityType.find(item => {
          return priority === Number(item.value);
        }).label;
      }
    },
    { name: 'screenshots', label: '问题截图录屏', type: 'fileShow', icon: 'el-icon-link' },
    { name: 'describe', label: '问题描述', type: 'normal', icon: 'el-icon-link' },
    { name: 'remark', label: '问题备注', type: 'normal', icon: 'el-icon-link' },
    { name: 'advice', label: '优化建议', type: 'normal', icon: 'el-icon-link' },
    { name: 'solution', label: '解决方案', type: 'normal', icon: 'el-icon-link' },
    { name: 'solutionCfUrl', label: '方案cf地址', type: 'autoGenerateType', icon: 'el-icon-link' },
    { name: 'repairTime', label: '预期修复时间', type: 'normal', icon: 'el-icon-link' },
    { name: 'reminderTime', label: '最后催办时间', type: 'normal', icon: 'el-icon-link' },
    {
      name: 'productModuleGroupId',
      label: '业务线类型',
      type: 'normal',
      icon: 'el-icon-link',
      processingShow: productModuleGroupId => {
        return findBusinessItem(productModuleGroupId);
      }
    },
    { name: 'problemName', label: '问题类型', type: 'normal', icon: 'el-icon-link' },
    { name: 'producName', label: '产品模块', type: 'normal', icon: 'el-icon-link' }
  ];
};

/** 处理体验问题，提交时的表单数据结构 */
export const resolveExperienceProblemForm = () => {
  return {
    priority: '',
    solution: '',
    solutionCfUrl: '',
    repairTime: ''
  };
};

/** 处理体验问题，表单Rule */
export const resolveExperienceProblemFormRules = {
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  solution: [{ required: true, message: '请输入解决方案', trigger: 'change' }],
  repairTime: [{ required: true, message: '请选择预期修复时间', trigger: 'change' }]
};

/** 处理体验问题，表单渲染数据结构 */
export const resolveExperienceProblemFormRenderer = () => {
  return {
    priority: {
      name: 'priority',
      label: '解决优先级',
      placeholder: '请输入解决优先级',
      type: 'select',
      multiple: false,
      options: {
        list: []
      }
    },
    solution: {
      name: 'solution',
      label: '解决方案',
      placeholder: '请输入解决方案',
      type: 'input',
      rows: 4,
      inpueType: 'textarea',
      maxlength: 500
    },
    solutionCfUrl: {
      name: 'solutionCfUrl',
      label: '方案cf地址',
      placeholder: '请输入url链接',
      type: 'input',
      maxlength: 150
    },
    repairTime: {
      name: 'repairTime',
      label: '预期修复时间',
      type: 'time',
      timeType: 'date'
    }
  };
};

/** 体验问题按钮类型 */
export const experienceProblemBtnTyle = {
  编辑: {
    buttonType: 0,
    label: '编辑',
    type: 'primary',
    clstag: '915J|55487'
  },
  处理: {
    buttonType: 1,
    label: '处理',
    type: 'primary',
    clstag: '915J|55488'
  },
  无需处理: {
    buttonType: 2,
    label: '无需处理',
    type: 'primary',
    clstag: '915J|55489'
  },
  转派: {
    buttonType: 3,
    label: '转派',
    type: 'primary',
    clstag: '915J|55490'
  },
  '状态更新(优化中)': {
    buttonType: 4,
    label: '状态更新(优化中)',
    type: 'primary',
    clstag: '915J|55491'
  },
  '状态更新(灰度中)': {
    buttonType: 5,
    label: '状态更新(灰度中)',
    type: 'primary',
    clstag: '915J|55491'
  },
  '状态更新(已完成)': {
    buttonType: 6,
    label: '状态更新(已完成)',
    type: 'primary',
    clstag: '915J|55493'
  },
  暂停: {
    buttonType: 7,
    label: '暂停',
    type: 'primary',
    clstag: '915J|55494'
  },
  状态更新: {
    buttonType: 100,
    label: '状态更新',
    type: 'primary',
    clstag: '915J|55495'
  }
};

/** 更改反馈进度，提交时的表单数据结构 */
export const progressForm = () => {
  return {
    progress: ''
  };
};

/** 更改反馈进度，表单Rule */
export const progressFormRules = {
  progress: [{ required: true, message: '请选择问题反馈', trigger: 'change' }]
};

/** 更改反馈进度 渲染数据结构 */
export const progressFormRenderer = () => {
  return {
    progress: {
      name: 'progress',
      label: '反馈进度',
      type: 'select',
      multiple: false,
      options: {
        list: []
      },
      disabled: false
    }
  };
};

/** 问题反馈按月汇总报表 表格展示 */
export const monthTableFields = () => {
  return [
    { key: 'month', label: '月份', type: 'default' },
    { key: 'waiting', label: '待排期', type: 'default' },
    { key: 'evaluate', label: '待评估', type: 'default' },
    { key: 'finished', label: '已完成', type: 'default' },
    { key: 'optimizing', label: '优化中', type: 'default' },
    { key: 'pause', label: '暂停', type: 'default' },
    { key: 'noProblem', label: '不是问题', type: 'default' },
    { key: 'total', label: '总计', type: 'default' },
    { key: 'finishingRate', label: '完成率', type: 'default' }
  ];
};

/**
 * 数据趋势 搜索表单数据
 */
export const feedbackDataSearchForm = () => {
  const obj = {
    时间范围_: [moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')],
    productModuleGroupId: '',
    priority: ''
  };
  return obj;
};

/**
 * 数据趋势 搜索表单渲染数据结构
 */
export const feedbackDataSearchFormRenderer = () => {
  const obj = {
    时间范围_: {
      name: '时间范围_',
      label: '时间范围',
      type: 'time',
      timeType: 'datetimerange',
      pickerOptions: {
        shortcuts: [
          {
            text: '最近7天',
            onClick(picker) {
              picker.$emit('pick', [moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')]);
            }
          },
          {
            text: '最近30天',
            onClick(picker) {
              picker.$emit('pick', [moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')]);
            }
          },
          {
            text: '最近90天',
            onClick(picker) {
              picker.$emit('pick', [moment().subtract(90, 'days').format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss')]);
            }
          }
        ]
      }
    },
    productModuleGroupId: {
      name: 'productModuleGroupId',
      label: '业务线类型',
      placeholder: '请选择',
      type: 'select',
      multiple: false,
      options: {
        list: []
      },
      selectionLogic: () => {} // 选择业务线之后执行的逻辑
    },
    priority: {
      name: 'priority',
      label: '优先级',
      placeholder: '请输入解决优先级',
      type: 'select',
      multiple: false,
      clearable: true,
      options: {
        list: priorityType
      }
    }
  };
  return obj;
};
