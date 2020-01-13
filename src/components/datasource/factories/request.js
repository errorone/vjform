import { register } from "../register";
import { get } from "lodash-es";
import transform from "../../transform";
import { loadSourceData } from "@/api/dform";

register("request", function(options, context) {
  const { watchs = [], autoload } = options;

  const instance = {
    loading: false,
    data: null,
    watchs: []
  };

  const load = () => {
    const clonedOptions = transform.call(context, options);

    if (options.dev) {
      return;
    }

    instance.loading = true;

    return loadSourceData(clonedOptions)
      .then(res => {
        instance.loading = false;
        instance.data =
          get(res, clonedOptions.dataPath || "data") ||
          clonedOptions.defaultData;
      })
      .catch(() => {
        instance.loading = false;
        if (clonedOptions.errorData !== undefined) {
          instance.data = clonedOptions.errorData;
        }
        // TODO: should emit 'error' event to component
      });
  };

  this.$nextTick(() => {
    const clonedOptions = transform.call(context, options);

    instance.data = clonedOptions.defaultData || null;

    watchs.forEach(watch => {
      instance.watchs.push(
        this.$watch(
          () => {
            // 兼容旧的写法
            if (
              !watch.startsWith("model.") &&
              !watch.startsWith("sourcedata.") &&
              !watch.startsWith("datasource.") &&
              !watch.startsWith("params.")
            ) {
              return get(context.model, watch);
            }
            return get(context, watch);
          },
          () => load()
        )
      );
    });

    if (autoload) {
      load();
    }
  });

  return instance;
});
