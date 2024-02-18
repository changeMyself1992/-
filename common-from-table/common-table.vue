<template>
  <div class="commonTable">
    <el-table :id="tableID" :data="data" border stripe :header-cell-style="{ background: '#f5f5f5' }" :max-height="tableHeight">
      <el-table-column v-for="info in feedbackFields" :key="info.key" :property="info.key" :label="info.label" :width="info.width || 'auto'" :fixed="info.fixed">
        <template slot-scope="scope">
          <span v-if="info.type === 'default'">
            {{ (info.processingShow && info.processingShow(scope.row)) || scope.row[info.key] }}
          </span>

          <div v-else-if="info.type === 'timline'">
            <el-popover trigger="hover" :content="scope.row[info.key]" popper-class="custom-popper">
              <el-link slot="reference" class="timline" :href="'timline://chat/?topin=' + scope.row[info.key]">
                {{ scope.row[info.key] }}
              </el-link>
            </el-popover>
          </div>

          <div v-else-if="info.type === 'fileShow'">
            <div v-for="(link, index) in linkStrSplit(scope.row[info.key])" :key="index">
              <el-button v-if="audioFormatOrNot(link)" type="text" @click="fileShow('video', link)">{{ `视频文件${index + 1}` }}</el-button>
              <el-image v-else-if="isPictureFormat(link)" class="pointer" :src="link" :preview-src-list="[link]" fit="cover"></el-image>
              <el-link v-else type="primary" :href="link || '#'" style="font-size: 12px">{{ `其他文件${index + 1}` }}</el-link>
            </div>
          </div>

          <div v-else-if="info.type === 'desc'">
            <el-popover v-if="scope.row[info.key].length > 28" width="400" trigger="hover" :content="scope.row[info.key]">
              <span class="desc" slot="reference">{{ (info.processingShow && info.processingShow(scope.row)) || scope.row[info.key] }}</span>
            </el-popover>
            <span v-else class="desc">{{ scope.row[info.key] }}</span>
          </div>
          <div v-else-if="info.type === 'link'" class="link-box">
            <el-link type="primary" v-for="(link, index) in linkStrSplit(scope.row[info.key])" :key="index" :href="link || '#'">{{ link }}</el-link>
          </div>

          <div v-else-if="info.type === 'autoGenerateType'">
            <div v-if="scopeRowKeyType(scope.row[info.key]) === 'desc'">
              <el-popover v-if="scope.row[info.key].length > 28" width="400" trigger="hover" :content="scope.row[info.key]">
                <span class="desc" slot="reference">{{ (info.processingShow && info.processingShow(scope.row)) || scope.row[info.key] }}</span>
              </el-popover>
              <span v-else class="desc">{{ scope.row[info.key] }}</span>
            </div>

            <div v-else-if="scopeRowKeyType(scope.row[info.key]) === 'link'" class="link-box">
              <el-link type="primary" v-for="(link, index) in linkStrSplit(scope.row[info.key])" :key="index" :href="link || '#'">{{ link }}</el-link>
            </div>
          </div>

          <div v-else-if="info.type === 'input'" class="inputBox">
            <el-input
              v-if="scope.row"
              v-model="scope.row[info.key]"
              @input="
                value => {
                
                }
              "
              placeholder=""
              style="width: 100px; text-align: center"
            ></el-input>
          </div>

          <div v-else-if="info.type === 'btnBox'" class="btnBox">
            <el-button
              v-for="item in info.btnList"
              :key="item.id"
              @click="item.handleClick(scope.row)"
              :type="item.type"
              size="medium"
              :clstag="(item && item.qdReport && item.qdReport.clstag) || ''"
              v-clsdata="JSON.stringify((item && item.qdReport && item.qdReport.ext) || '')"
              :icon="item.icon"
              >{{ item.label }}</el-button
            >
          </div>
        </template>
      </el-table-column>
    </el-table>
    <scrollbar v-if="feedbackFields.length > 0 && tableHeight === 'auto' && showScrollbar" :tableID="tableID" :downwardThreshold="60" />

    <div v-if="showPagination" class="pagination">
      <el-pagination background layout="total,prev, pager, next" @current-change="handleCurrentChange" :current-page="pageNo || 1" :total="total" />
    </div>

    <el-dialog title="文件展示" :visible.sync="dialogVisible" width="40%" class="show-dialog" top="0">
      <video v-if="fileType === 'video' && link" :src="link" controls="controls"></video>
    </el-dialog>
  </div>
</template>

<script>
import { validAudio, validPicture, validURL } from '@/util/validate';
import scrollbar from '../scrollbar/index.vue';
export default {
  name: 'CommonTable',
  components: { scrollbar },
  props: {
    data: {
      type: Array,
      default: () => {
        return [];
      }
    },
    feedbackFields: {
      type: Array,
      default: () => {
        return [];
      }
    },
    handleCurrentChange: {
      type: Function,
      default: () => {}
    },
    total: {
      type: Number,
      default: 0
    },
    pageNo: {
      type: Number,
      default: 1
    },
    tableHeight: {
      type: [String, Number],
      default: 'auto'
    },
    showPagination: {
      type: Boolean,
      default: true
    },
    showScrollbar: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      dialogVisible: false,
      fileType: '',
      link: '',
      tableID: `common-table-${Date.now()}`
    };
  },
  methods: {
    // 链接 分割
    linkStrSplit(linksStr) {
      if (linksStr) {
        const array = linksStr.split(';').filter(str => {
          return str;
        });
        if (array.length > 0) {
          return array;
        }
      }
      return [];
    },
    /** 判断是否是视频格式 */
    audioFormatOrNot(linksStr) {
      return validAudio(linksStr);
    },
    /** 判断是否是图片格式 */
    isPictureFormat(linksStr) {
      return validPicture(linksStr);
    },
    fileShow(fileType, link) {
      this.fileType = fileType;
      this.link = link;
      this.dialogVisible = true;
    },
    // 判断字段值是什么列元素
    scopeRowKeyType(linksStr) {
      const array = this.linkStrSplit(linksStr);
      if (array.length > 0 && validURL(array[0])) {
        return 'link';
      }
      return 'desc';
    }
  }
};
</script>

<style lang="scss" scoped>
.commonTable {
  margin-top: 20px;
  .desc {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-overflow: ellipsis;
    white-space: pre-wrap;
  }
  .link-box {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .pointer {
    cursor: pointer;
    height: 50px;
  }
  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
  .btnBox {
    text-align: center;
  }
}
</style>

<style>
.commonTable .el-dialog__body {
  display: flex;
  justify-content: center;
}
.commonTable .show-dialog video {
  /* max-height: calc(100vh - 60px); */
  max-width: 100%;
}
.commonTable .el-textarea .el-input__count {
  background-color: transparent;
  bottom: -24px;
  right: 0;
}

.commonTable .timline {
  max-width: 100%;
}
.commonTable .timline .el-link--inner {
  font-size: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.custom-popper {
  text-align: center;
}
</style>
