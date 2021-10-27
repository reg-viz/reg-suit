const factory = () => ({
  notifier: {
    notify: () => Promise.resolve("notify"),
  },
});

exports.default = factory;
