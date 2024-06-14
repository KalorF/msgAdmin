import { defineStore } from "pinia";
import { store } from "@/store";
import type { cacheType } from "./types";
import { constantMenus } from "@/router";
import { useMultiTagsStoreHook } from "./multiTags";
import { debounce, getKeyList } from "@pureadmin/utils";
import { ascending, filterTree, filterNoPermissionTree } from "@/router/utils";
import { ref } from 'vue';

const resourceMap = {
  SimpleBI: ['/'],
  AccountManager: ['/account'],
  CustomerTagManager: ['/tag'],
  CustomerActionManager: ['/customer', '/customerpool'],
  SimpleCustomer: ['/mycustomer'],
  OrganizationManager: ['/org'],
  BankManager: ['/bank'],
  CourseManager: ['/course'],
  SimpleCourse: ['/study'],
  ProgressManager: ['/progress_set'],
  ResourceSimpleExam: ['/myexam'],
  ResourceExamManager: ['/exammanger']
};

const otherMap = {
  exam: ['/exammanger'],
  myexam: ['/myexam'],
}

export const usePermissionStore = defineStore({
  id: "pure-permission",
  state: () => ({
    // 静态路由生成的菜单
    constantMenus,
    // 整体路由生成的菜单（静态、动态）
    wholeMenus: [],
    // 缓存页面keepAlive
    cachePageList: [],
    policies:JSON.parse(window.localStorage.getItem('_policy') || '{}') || {},
  }),
  actions: {
    setPolicies(policies: any) {
      this.policies = policies;
    },
    /** 组装整体路由生成的菜单 */
    handleWholeMenus(routes: any[]) {
      this.wholeMenus = filterNoPermissionTree(
        filterTree(ascending(this.constantMenus.concat(routes)))
      );
      if (Object.keys(this.policies).length) {
        const { resources } = this.policies;
        const hasRes = resources.map(i => i.name) || [];
        const list = [];
        hasRes.map(item => {
          if (resourceMap[item]) {
            list.push(...resourceMap[item]);
          }
        })
        // list.push(...otherMap['exam']);
        // list.push(...otherMap['myexam']);
        this.wholeMenus = this.wholeMenus.filter(v => list.includes(v.path));
      }
      // this.wholeMenus = this.constantMenus.concat(routes);
    },
    cacheOperate({ mode, name }: cacheType) {
      const delIndex = this.cachePageList.findIndex(v => v === name);
      switch (mode) {
        case "refresh":
          this.cachePageList = this.cachePageList.filter(v => v !== name);
          break;
        case "add":
          this.cachePageList.push(name);
          break;
        case "delete":
          delIndex !== -1 && this.cachePageList.splice(delIndex, 1);
          break;
      }
      /** 监听缓存页面是否存在于标签页，不存在则删除 */
      debounce(() => {
        let cacheLength = this.cachePageList.length;
        const nameList = getKeyList(useMultiTagsStoreHook().multiTags, "name");
        while (cacheLength > 0) {
          nameList.findIndex(v => v === this.cachePageList[cacheLength - 1]) ===
            -1 &&
            this.cachePageList.splice(
              this.cachePageList.indexOf(this.cachePageList[cacheLength - 1]),
              1
            );
          cacheLength--;
        }
      })();
    },
    /** 清空缓存页面 */
    clearAllCachePage() {
      this.wholeMenus = [];
      this.cachePageList = [];
    }
  }
});

export function usePermissionStoreHook() {
  return usePermissionStore(store);
}

export function usePermissionActionStroe() {
  const store = usePermissionStoreHook();
  if (store.policies && store.policies.actions) {
    return ref(store.policies.actions.map((item: any) => item.name))
  } else {
    return ref([]);
  }
}
