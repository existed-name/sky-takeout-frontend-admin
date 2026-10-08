export const formatDate = () => {
  const now = new Date();
  let hour: string | number = now.getHours();
  let minute: string | number = now.getMinutes();
  let second: string | number = now.getSeconds();
  if (hour < 10) hour = `0${hour}`;
  if (minute < 10) minute = `0${minute}`;
  if (second < 10) second = `0${second}`;
  return `${hour}:${minute}:${second}`;
};

function dateFormat(fmt: any, time: any) {
  let date = new Date(time);
  let ret;
  const opt = {
    // 年
    "Y+": date.getFullYear().toString(),
    // 月
    "m+": (date.getMonth() + 1).toString(),
    // 日
    "d+": date.getDate().toString()
    // 有其他格式化字符需求可以继续添加，必须转化成字符串
  } as any;
  for (const k in opt) {
    ret = new RegExp("(" + k + ")").exec(fmt);
    if (ret) {
      fmt = fmt.replace(
        ret[1],
        ret[1].length == 1 ? opt[k] : opt[k].padStart(ret[1].length, "0")
      );
    }
  }
  return fmt;
}

// js获取昨日的日期
export const get1stAndToday = () => {
  let toData = new Date(new Date().toLocaleDateString()).getTime();
  let yesterdayStart = toData - 3600 * 24 * 1000;
  let yesterdayEnd = yesterdayStart + 24 * 60 * 60 * 1000 - 1;
  let startDay1 = dateFormat("YYYY-mm-dd", yesterdayStart);
  let endDay1 = dateFormat("YYYY-mm-dd", yesterdayEnd);
  return [startDay1, endDay1];
};
// 获取昨日、今日日期
export const getday = () => {
  let toData = new Date(new Date().toLocaleDateString()).getTime();
  let yesterdays= toData - 3600 * 24 * 1000;
  let yesterday = dateFormat("YYYY-mm-dd", yesterdays);
  let today = dateFormat("YYYY-mm-dd", toData);
  return [yesterday,today];
};

// 获取近7日
export const past7Day = () => {
  let toData = new Date(new Date().toLocaleDateString()).getTime();
  // 近 7 日按「含今天、共 7 天」计算：起点为今天向前数第 7 天（今天 − 6 天），终点为今天
  let past7daysStart = toData - 6 * 3600 * 24 * 1000;
  let past7daysEnd = toData;
  let days7Start = dateFormat("YYYY-mm-dd", past7daysStart);
  let days7End = dateFormat("YYYY-mm-dd", past7daysEnd);
  return [days7Start, days7End];
};

// 获取近30日
export const past30Day = () => {
  let toData = new Date(new Date().toLocaleDateString()).getTime();
  // 近 30 日按「含今天、共 30 天」计算：起点为今天向前数第 30 天（今天 − 29 天），终点为今天
  let past30daysStart = toData - 29 * 3600 * 24 * 1000;
  let past30daysEnd = toData;
  let days30Start = dateFormat("YYYY-mm-dd", past30daysStart);
  let days30End = dateFormat("YYYY-mm-dd", past30daysEnd);
  return [days30Start, days30End];
};
// 获取本周
export const pastWeek = () => {
  let toData = new Date(new Date().toLocaleDateString()).getTime();
  var nowDayOfWeek = new Date().getDay();
  // getDay() 周日为 0，需换算成「距离本周一的天数」：周一 0、周二 1 …… 周日 6，
  // 否则星期日会被算成「下周一到下周日」；区间按「周一 ~ 周日」且含今天
  var daysFromMonday = (nowDayOfWeek + 6) % 7;
  const weekStartData = toData - daysFromMonday * 24 * 60 * 60 * 1000;
  const weekEndData = weekStartData + 6 * 24 * 60 * 60 * 1000;
  let weekStart = dateFormat("YYYY-mm-dd", weekStartData);
  let weekEnd = dateFormat("YYYY-mm-dd", weekEndData);
  return [weekStart, weekEnd];
};
// 获取本月
export const pastMonth = () => {
  let year = new Date().getFullYear()
  let month =new Date().getMonth()
  const monthStartData = new Date(year, month, 1).getTime()
  const monthEndData = new Date(year, month + 1, 0).getTime() + 24 * 60 * 60 * 1000 - 1
  let monthStart = dateFormat("YYYY-mm-dd", monthStartData);
  let monthEnd = dateFormat("YYYY-mm-dd", monthEndData);
  return [monthStart, monthEnd];
};
