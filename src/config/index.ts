import axios from "axios";
import type { App } from "vue";

const themeConfig = {
  "Version": "5.3.0",
  "Title": "通信信息咨询",
  "FixedHeader": true,
  "HiddenSideBar": false,
  "MultiTagsCache": false,
  "KeepAlive": true,
  "Layout": "vertical",
  "Theme": "light",
  "DarkMode": false,
  "OverallStyle": "light",
  "Grey": false,
  "Weak": false,
  "HideTabs": false,
  "HideFooter": false,
  "Stretch": false,
  "SidebarStatus": true,
  "EpThemeColor": "#ff922b",
  "ShowLogo": true,
  "ShowModel": "smart",
  "MenuArrowIconNoTransition": false,
  "CachingAsyncRoutes": false,
  "TooltipEffect": "light",
  "ResponsiveStorageNameSpace": "responsive-",
  "MenuSearchHistory": 6
}

let config: object = {};
const { VITE_PUBLIC_PATH } = import.meta.env;

const setConfig = (cfg?: unknown) => {
  config = Object.assign(config, cfg);
};

const getConfig = (key?: string): PlatformConfigs => {
  if (typeof key === "string") {
    const arr = key.split(".");
    if (arr && arr.length) {
      let data = config;
      arr.forEach(v => {
        if (data && typeof data[v] !== "undefined") {
          data = data[v];
        } else {
          data = null;
        }
      });
      return data;
    }
  }
  return config;
};

/** 获取项目动态全局配置 */
export const getPlatformConfig = async (app: App): Promise<undefined> => {
  app.config.globalProperties.$config = getConfig();
   let $config = app.config.globalProperties.$config;
    // 自动注入项目配置
    if (app && $config && typeof themeConfig === "object") {
      $config = Object.assign($config, themeConfig);
      app.config.globalProperties.$config = $config;
      // 设置全局配置
      setConfig($config);
    }
  return Promise.resolve($config);
  // return axios({
  //   method: "get",
  //   url: `${VITE_PUBLIC_PATH}platform-config.json`
  // })
  //   .then(({ data: config }) => {
     
  //     return $config;
  //   })
  //   .catch(() => {
  //     throw "请在public文件夹下添加platform-config.json配置文件";
  //   });
};

/** 本地响应式存储的命名空间 */
const responsiveStorageNameSpace = () => getConfig().ResponsiveStorageNameSpace;

export { getConfig, setConfig, responsiveStorageNameSpace };
