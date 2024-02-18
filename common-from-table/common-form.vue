<template>
  <el-form v-if="Object.keys(formData).length > 0" ref="form" class="record-dialog" :label-width="labelWidth" :inline="inline" :model="formData" :rules="rules">
    <template v-for="item in fieldMap">
      <el-form-item :prop="item.name" :label="item.label" :key="item.name" v-if="validBind(item) && validUnbind(item) && Object.keys(item).length > 0">
        <!-- 输入框 -->
        <template v-if="item.type === 'input'">
          <el-input
            v-model="formData[item.name]"
            :type="item.inpueType"
            :placeholder="item.placeholder"
            :rows="item.rows"
            :disabled="item.disabled"
            :maxlength="item.maxlength"
            show-word-limit
            @change="
              value => {
                item && item.inputChange && item.inputChange(value, item);
              }
            "
          />
        </template>
        <!-- 数字输入框 -->
        <template v-if="item.type === 'InputNumber'">
          <el-input-number v-model="formData[item.name]" :step="1" :min="0" step-strictly></el-input-number>
        </template>
        <!-- 下拉选择框 -->
        <template v-else-if="item.type === 'select'">
          <div class="selecy">
            <el-select
              v-model="formData[item.name]"
              :placeholder="item.placeholder"
              :multiple="item.multiple"
              :clearable="item.clearable ? true : false"
              collapse-tags
              :disabled="item.disabled"
              @change="
                val => {
                  changeSelect(val, item);
                }
              "
            >
              <el-option v-for="optionItem in item.options.list" :label="optionItem.label" :value="optionItem.value" :key="optionItem.value" />
            </el-select>
            <div v-if="item.desc">{{ item.desc }}</div>
          </div>
        </template>

        <!-- erp选择框 -->
        <template v-else-if="item.type === 'findErp'">
          <find-erp :value.sync="formData[item.name]" :placeholder="item.placeholder" prefix="el-icon-search" :disabled="item.disabled"></find-erp>
        </template>

        <!-- 输入多个erp -->
        <template v-else-if="item.type === 'listErp'">
          <el-form-item v-for="(listItem, index) in formData[item.name]" :key="index" :prop="`${item.name}[${index}][${item.bindKey}]`" :rules="rules[item.name]">
            <find-erp :value.sync="formData[item.name][index][item.bindKey]" :placeholder="item.placeholder" prefix="el-icon-search" :disabled="item.disabled"></find-erp>

            <el-button v-if="index > 0" @click.prevent="item.removeItem(index)">删除</el-button>
            <el-button v-else @click.prevent="item.addItem">新增</el-button>
          </el-form-item>
        </template>

        <!-- 级联选择框 -->
        <template v-else-if="item.type === 'cascader'">
          <el-cascader
            v-model="formData[item.name]"
            :key="item.name"
            :options="item.options"
            :placeholder="item.placeholder"
            clearable
            @change="
              val => {
                changeCascader(val, item);
              }
            "
            :props="{ multiple: item.multiple }"
            collapse-tags
          ></el-cascader>
        </template>

        <!-- 时间 -->
        <template v-else-if="item.type === 'time'">
          <el-date-picker
            v-model="formData[item.name]"
            format="yyyy-MM-dd HH:mm:ss"
            value-format="yyyy-MM-dd HH:mm:ss"
            align="right"
            :type="item.timeType"
            :picker-options="item.pickerOptions || {}"
            placeholder="选择日期"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :default-time="item.timeType === 'datetimerange' ? ['00:00:00', '23:59:59'] : null"
          />
          <div v-if="item.desc">{{ item.desc }}</div>
        </template>

        <!-- 单选 -->
        <template v-else-if="item.type === 'radio'">
          <el-radio-group v-model="formData[item.name]">
            <template v-for="optionItem in item.options.list">
              <el-radio
                :label="optionItem.label"
                :key="optionItem.value"
                @change="
                  val => {
                    changeRadio(val, optionItem);
                  }
                "
              >
                {{ optionItem.value }}
                <span v-if="optionItem.des && formData[item.name] === optionItem.label" class="radio-des">
                  {{ optionItem.des }}
                </span>
              </el-radio>
            </template>
          </el-radio-group>
        </template>
        <!-- 多选 -->
        <template v-else-if="item.type === 'checkbox'">
          <el-checkbox-group v-model="formData[item.name]">
            <template v-for="(group, index) in item.options">
              <div :key="group.name + index + '1'" style="height: 20px"></div>
              <div :key="group.name + index" style="font-size: 14px">{{ group.name }}</div>
              <template v-for="optionItem in group.values">
                <el-checkbox :label="optionItem.value" :key="optionItem.value" style="width: 100%">
                  {{ optionItem.label }}
                  <span v-if="optionItem.des && formData[item.name] === optionItem.label" class="radio-des">
                    {{ optionItem.des }}
                  </span>
                </el-checkbox>
              </template>
            </template>
          </el-checkbox-group>
        </template>

        <!-- 输入列表 -->
        <template v-else-if="item.type === 'list'">
          <div class="items-box">
            <el-form-item
              v-for="(listItem, index) in formData[item.name]"
              :key="index"
              label-width="80px"
              :label="`${item.itemLabel || '元素'}-${index + 1}`"
              :prop="`${item.name}[${index}].url`"
              :rules="rules.url"
            >
              <el-input v-model="listItem['url']" :placeholder="item.placeholder"></el-input>
              <el-button v-if="index > 0" @click.prevent="removeUrl(listItem, item.name)">删除</el-button>
              <el-button v-else @click.prevent="addUrl(item.name)">新增</el-button>
            </el-form-item>
          </div>
        </template>

        <!-- 输入列表 -->
        <template v-else-if="item.type === 'listInputNumber'">
          <div class="items-box">
            <el-form-item
              v-for="(inputNumberKey, index) in Object.keys(formData[item.name])"
              :key="index"
              label-width="100px"
              :label="item[inputNumberKey].label"
              :prop="`${item.name}.${inputNumberKey}`"
              :rules="rules[inputNumberKey]"
            >
              <!-- <el-input-number v-model="formData[item.name][inputNumberKey]" :step="1" :min="0" step-strictly></el-input-number> -->

              <el-input
                style="width: 100px; text-align: center; margin-right: 30px"
                v-model="formData[item.name][inputNumberKey]"
                @change="
                  value => {
                    item[inputNumberKey] && item[inputNumberKey].inputNumberChange && item[inputNumberKey].inputNumberChange(value, item, inputNumberKey);
                  }
                "
              ></el-input>

              <el-button
                icon="el-icon-minus"
                @click="
                  () => {
                    item[inputNumberKey] && item[inputNumberKey].handleMinus && item[inputNumberKey].handleMinus(item, inputNumberKey);
                  }
                "
              ></el-button>
              <el-button
                icon="el-icon-plus"
                @click="
                  () => {
                    item[inputNumberKey] && item[inputNumberKey].handlePlus && item[inputNumberKey].handlePlus(item, inputNumberKey);
                  }
                "
              ></el-button>
            </el-form-item>
          </div>
        </template>

        <template v-else-if="item.type === 'upload'">
          <el-upload
            action="string"
            :limit="item.limit || 1"
            :file-list="item.fileList"
            :disabled="item.disabled"
            :multiple="item.limit && item.limit > 1"
            :before-upload="
              file => {
                return beforeUpload(file, item.maxFileSize, item.typeValidationMethod);
              }
            "
            :http-request="
              file => {
                uploadFile(file, url => {
                  formData[item.name].push(url);
                  item.setFileList([...item.fileList, { name: file.file.name, url }]);
                });
              }
            "
            :on-exceed="
              () => {
                handleExceed(item.limit);
              }
            "
            :on-remove="
              (file, fileList) => {
                item.setFileList(fileList);
                const index = formData[item.name].findIndex(url => {
                  return url === file.url;
                });
                if (index != -1) {
                  formData[item.name].splice(index, 1);
                }
              }
            "
            :on-error="errFun"
          >
            <el-button size="small" type="primary" :disabled="item.disabled">点击上传</el-button>
            <div slot="tip" class="el-upload__tip">{{ item.placeholder }}</div>
          </el-upload>
        </template>

        <!-- card -->
        <template v-else-if="item.type === 'card'">
          <el-card class="box-card" v-for="(optionItem, index) in item.options" :key="index" :header="optionItem.head">
            <div>
              <el-form-item v-if="optionItem.examine" label="审核人" label-width="60px">
                <el-select v-model="formData[item.name][index]['selectedValue']" placeholder="请选择">
                  <el-option v-for="exam in optionItem.examineList" :key="exam.value" :label="exam.label" :value="exam.value"></el-option>
                </el-select>
              </el-form-item>

              <div v-if="optionItem.needUpload">
                <el-radio-group
                  v-model="formData[item.name][index]['profileType']"
                  @change="
                    () => {
                      optionItem.setFileList([]);
                      clearProfileDesc(item.name, index);
                    }
                  "
                >
                  <el-radio :label="0">无需提交审核材料</el-radio>
                  <el-radio :label="1">上传审核材料</el-radio>
                  <el-radio :label="2">填写cf文档地址</el-radio>
                </el-radio-group>
              </div>
              <div>
                <el-input v-if="formData[item.name][index]['profileType'] === 2" placeholder="文件连接地址" v-model="formData[item.name][index]['profileDesc']"></el-input>
                <el-upload
                  v-if="formData[item.name][index]['profileType'] === 1"
                  action="string"
                  :http-request="
                    file => {
                      uploadFile(file, url => {
                        formData[item.name][index].profileDesc = url;
                        optionItem.setFileList([...optionItem.fileList, { name: file.file.name, url }]);
                      });
                    }
                  "
                  :before-upload="beforeUpload"
                  :on-exceed="handleExceed"
                  :on-remove="handleRemove"
                  :on-error="errFun"
                  :limit="1"
                  :file-list="optionItem.fileList"
                  :disabled="!!formData[item.name][index]['profileDesc']"
                >
                  <el-button size="small" type="primary" style="margin-top: 10px" :disabled="!!formData[item.name][index]['profileDesc']">点击上传</el-button>
                  <div slot="tip" class="el-upload__tip">上传文件大小限制5M以内，只能上传1个文件，多个文件请压缩后上传；超出限制大小文件请上传存储链接。</div>
                </el-upload>
              </div>
              <div v-if="optionItem.special" style="display: inline-flex">
                <span>客服报备模板：</span>
                <el-link type="primary" href="http://storage.jd.local/upss/%E9%99%84%E4%BB%B6%E4%BA%8C.xlsx">金刚区上下架</el-link>、<el-link
                  type="primary"
                  href="http://storage.jd.local/upss/%E9%99%84%E4%BB%B6%E5%9B%9B.xlsx"
                  >全新产品客服培训承接</el-link
                >、<el-link type="primary" href="http://storage.jd.local/upss/%E9%99%84%E4%BB%B6%E4%B8%80.xlsx">营销活动</el-link>。
              </div>
            </div>
          </el-card>
          <h4 style="color: #f56c6c">{{ item.desc || '温馨提示：表单内容提交后不可修改' }}</h4>
        </template>

        <template v-else-if="item.type === 'cardList'">
          <el-card class="box-card" v-for="(item1, index1) in item.children" :key="index1">
            <div slot="header" class="car-header">
              <span>{{ item.headerName || '' }}</span>
              <div v-if="item.btnList && item.btnList.length > 0" class="btnList">
                <el-button v-for="btn in item.btnList" :key="btn.id" :type="btn.type" size="mini" :plain="true" @click="btn.handleClick(index1)">{{ btn.label }}</el-button>
              </div>
            </div>

            <template v-for="(value1, key1) in item1">
              <el-form-item
                v-if="value1"
                :key="key1"
                :rules="rules[`${item.name}${index1}`][value1.name]"
                :prop="`${item.name}.${index1}.${value1.name}`"
                :label="value1.label"
                style="margin-bottom: 22px"
              >
                <template v-if="value1.type === 'input'">
                  <el-input
                    v-model="formData[item.name][index1][key1]"
                    :type="value1.inpueType"
                    :placeholder="value1.placeholder"
                    :rows="value1.rows"
                    :disabled="value1.disabled"
                    :maxlength="value1.maxlength"
                    show-word-limit
                  />
                </template>

                <template v-if="value1.type === 'object'">
                  <div>
                    <div>{{ value1.des }}</div>
                    <el-form-item
                      v-for="(value2, key2) in value1.keys"
                      :key="key2"
                      :label="value2.label"
                      label-width="80px"
                      style="margin-bottom: 22px"
                      :prop="`${item.name}.${index1}.${value1.name}.${value2.name}`"
                      :rules="rules[`${item.name}${index1}`][`${value1.name}.${value2.name}`]"
                    >
                      <template v-if="value2.type === 'input'">
                        <el-input
                          v-model="formData[item.name][index1][key1][key2]"
                          :type="value2.inpueType"
                          :placeholder="value2.placeholder"
                          :rows="value2.rows"
                          :disabled="value2.disabled"
                          :maxlength="value2.maxlength"
                          show-word-limit
                        />
                      </template>
                    </el-form-item>
                  </div>
                </template>

                <template v-else-if="value1.type === 'upload'">
                  <el-upload
                    action="string"
                    :list-type="value1.listType || ''"
                    :limit="value1.limit || 1"
                    :file-list="value1.fileList"
                    :disabled="value1.disabled"
                    :multiple="value1.limit && value1.limit > 1"
                    :before-upload="
                      file => {
                        return beforeUpload(file, value1.maxFileSize, value1.typeValidationMethod);
                      }
                    "
                    :http-request="
                      file => {
                        uploadFile(file, url => {
                          formData[item.name][index1][key1].push(url);
                          value1.setFileList([...value1.fileList, { name: file.file.name, url }]);
                        });
                      }
                    "
                    :on-exceed="
                      () => {
                        handleExceed(value1.limit);
                      }
                    "
                    :on-remove="
                      (file, fileList) => {
                        value1.setFileList(fileList);
                        const index = formData[item.name][index1][key1].findIndex(url => {
                          return url === file.url;
                        });
                        if (index != -1) {
                          formData[item.name][index1][key1].splice(index, 1);
                        }
                      }
                    "
                    :on-error="errFun"
                  >
                    <i slot="default" class="el-icon-plus"></i>
                    <div slot="tip" class="el-upload__tip">{{ value1.placeholder }}</div>
                  </el-upload>
                </template>
              </el-form-item>
            </template>
          </el-card>
        </template>
      </el-form-item>
    </template>

    <el-form-item>
      <div class="btn-list">
        <el-button v-for="btn in btnList" :key="btn.id" :type="btn.type" @click="throttleBtnClick(btn)">{{ btn.btnLabel }}</el-button>
      </div>
    </el-form-item>
  </el-form>
  <div v-else>
    <slot name="skeleton"></slot>
  </div>
</template>

<script>
import request from '@/util/request';
import FindErp from '@/components/findErp/findErp';
import throttle from 'lodash/throttle';
export default {
  name: 'CommonForm',
  components: { FindErp },
  props: {
    labelWidth: {
      type: String,
      default: '140px'
    },
    inline: {
      type: Boolean,
      default: false
    },
    btnList: {
      type: Array,
      default: () => {
        return [
          // {
          //   id: 0,
          //   type: "primary", // 按钮样式
          //   clickMode: "submit", //是否需要表单验证
          //   btnLabel: "提交",
          //   handleClick: () => {}, //点击该按钮要执行的方法
          // },
        ];
      }
    }
  },
  data() {
    return {
      fieldMap: {},
      rules: {},
      formData: {},
      throttleBtnClick: () => {}
    };
  },
  computed: {},
  watch: {},
  created() {},
  mounted() {
    this.throttleBtnClick = throttle(this.handleBtnClick, 1000, { trailing: false });
  },
  methods: {
    init(formConfig) {
      const { fieldMap = {}, rules = {}, formData = {} } = formConfig;
      const dataKeys = Object.keys(formData);
      if (dataKeys.length > 0) {
        this.formData = {};
        this.$nextTick(() => {
          dataKeys.forEach(key => {
            this.$set(this.formData, key, formData[key]);
          });
        });
      }

      const ruleKeys = Object.keys(rules);
      if (ruleKeys.length > 0) {
        this.rules = {};
        this.$nextTick(() => {
          ruleKeys.forEach(key => {
            this.$set(this.rules, key, rules[key]);
          });
        });
      }

      const mapKeys = Object.keys(fieldMap);
      if (mapKeys.length > 0) {
        this.fieldMap = {};
        this.$nextTick(() => {
          mapKeys.forEach(key => {
            this.$set(this.fieldMap, key, fieldMap[key]);
          });
        });
      }

      this.$nextTick(() => {
        if (this.$refs.form && this.$refs.form.clearValidate) {
          this.$refs.form.clearValidate();
        }
      });
    },
    validBind: function (item) {
      const bind = item.bind;
      let valid = true;
      if (bind && bind.length > 0) {
        bind.forEach(b => {
          if (this.formData[b.name] !== b.value) {
            valid = false;
          }
        });
      }
      return valid;
      // bindName:{name:'jumpApp',value:0}
    },
    validUnbind: function (item) {
      const bind = item.unBind;
      let valid = true;
      if (bind && bind.length > 0) {
        valid = false;
        bind.forEach(b => {
          if (this.formData[b.name] !== b.value) {
            valid = true;
          }
        });
      }
      return valid;
    },
    clearProfileDesc(name, index) {
      this.formData[name][index].profileDesc = '';
    },
    /** 文件上传前调用 */
    beforeUpload(file, maxFileSize = 5, typeValidationMethod = undefined) {
      const isLimit = file.size / 1024 / 1024 < maxFileSize;
      if (!isLimit) {
        this.$message.error(`上传文件大小不能超过 ${maxFileSize}MB!`);
        return false;
      }
      if (typeValidationMethod && typeof typeValidationMethod === 'function') {
        if (!typeValidationMethod(file.name)) {
          this.$message.error(`请上传符合要求的文件!`);
          return false;
        }
      }
      return true;
    },
    /**
     * @description: 上传文件
     * @param {*} cb 上传文件后执行的回掉
     */
    uploadFile(file, cb) {
      const formDat = new FormData();
      formDat.append('file', file.file);
      formDat.append('category', 1);
      request
        .uploadFile({
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          data: formDat
        })
        .then(res => {
          cb(res.url);
        })
        .catch(err => {
          console.error(err);
        });
    },

    /** 上传文件超出数量范围调用 */
    handleExceed(limit = 1) {
      this.$message.warning(`只能上传${limit}个文件哦`);
    },

    /** 删除文件时调用 */
    handleRemove(file, fileList) {
      console.log(file, fileList);
    },
    /** 文件上传遇到异常时调用 */
    errFun(err, file, fileList) {
      console.error(err, file, fileList);
    },
    /** 级联选择器发生改变的时候 */
    changeCascader(value, item) {
      if (item.bindKeys && item.bindKeys.length > 0 && item.getFunctionaryErpFormProductModule) {
        const relevantPersonnelErpArray = [];
        if (item.multiple) {
          for (let i = 0; i < value.length; i++) {
            const productIdArray = value[i];
            relevantPersonnelErpArray.push(item.getFunctionaryErpFormProductModule(productIdArray, this.formData.productModuleGroupId || 1));
          }
        } else {
          relevantPersonnelErpArray.push(item.getFunctionaryErpFormProductModule(value, this.formData.productModuleGroupId || 1));
        }
        console.log('相关人erp数组:::', relevantPersonnelErpArray);
        for (let i = 0; i < item.bindKeys.length; i++) {
          const key = item.bindKeys[i];
          const strArray = [];
          for (let j = 0; j < relevantPersonnelErpArray.length; j++) {
            const relevantPersonnelErp = relevantPersonnelErpArray[j];
            strArray.push(relevantPersonnelErp[key]);
          }
          console.log('strArray:::', strArray);
          this.formData[key] = strArray.join(';');
        }
      }

      if (item.displayKeys && item.displayKeys.length > 0 && item.selectionLogic) {
        item.selectionLogic(value, item);
      }
    },
    /** select选择器发生改变的时候 */
    changeSelect(value, item) {
      if (item.selectionLogic && typeof item.selectionLogic === 'function') {
        item.selectionLogic(value, item);
      }
    },
    changeRadio(value, item) {
      if (item.radioLogic && typeof item.radioLogic === 'function') {
        item.radioLogic(value, item);
      }
    },

    handleBtnClick(btn) {
      if (btn.clickMode === 'submit') {
       this.submit('form', btn.handleClick);
      } else {
        btn.handleClick();
      }
    },

    async submit(formName, cb) {
      this.$refs[formName].validate(async valid => {
        if (valid) {
          await cb();
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },
    /** 添加线上页面地址元素 */
    addUrl(name) {
      const index = this.formData[name].findIndex(item => {
        return item.url === '';
      });
      if (index !== -1) {
        this.$message.warning('请填写了有意义的url再新增');
        return;
      }
      this.formData[name].push({
        url: ''
      });
    },
    /** 删除线上页面地址元素 */
    removeUrl(item, name) {
      const index = this.formData[name].indexOf(item);
      if (index !== -1) {
        this.formData[name].splice(index, 1);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.record-dialog {
  .selecy {
    display: flex !important;
  }
  .el-row {
    margin-top: 20px;
  }
  .el-card {
    margin-bottom: 20px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .radio-des {
    position: absolute;
    left: 28px;
    bottom: -20px;
    color: #606266;
  }
  .btn {
    padding-top: 10px;
  }
  .car-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    .btnList {
      display: flex;
    }
  }

  .items-box {
    padding-top: 36px;
  }
}
</style>

<style>
.record-dialog .items-box .el-form-item {
  margin-bottom: 22px;
}
.record-dialog .items-box .el-form-item:last-child {
  margin-bottom: 0;
}
.record-dialog .items-box .el-input {
  width: 70%;
  margin-right: 10px;
}
.record-dialog .el-textarea .el-input__count {
  bottom: -24px;
  background: transparent;
}
.record-dialog .el-upload.el-upload--picture-card {
  width: 100px;
  height: 100px;
  line-height: 100px;
}
.record-dialog .el-upload-list--picture-card .el-upload-list__item {
  width: 100px;
  height: 100px;
}
</style>
