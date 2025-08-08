export type WeatherRequestParams = {
	Authorization: string;
	limit?: number;
	offset?: number;
	format?: 'JSON' | 'XML';
	locationName?: string[];
	elementName?: string[];
	sort?: string;
	startTime?: string[];
	timeFrom?: string;
	timeTo?: string;
};

export type WeatherResponse = {
	success: string;
	result: WeatherResult;
	records: WeatherRecords;
};

export type WeatherResult = {
	resource_id: 'F-C0032-001';
	fields: Array<{
		id: string;
		type: string;
	}>;
};

export type WeatherRecords = {
	datasetDescription: '三十六小時天氣預報';
	location: WeatherLocation[];
};

export type WeatherTimeElement = {
	startTime: string;
	endTime: string;
	Wx?: ParameterWx;
	Pop?: ParameterPop;
	MinT?: ParameterMinT;
	CI?: ParameterCI;
	MaxT?: ParameterMaxT;
};
export type WeatherLocation = {
	locationName: string;
	weatherElement: WeatherElement[];
};

export type WeatherElement =
	| WeatherElementWx
	| WeatherElementPop
	| WeatherElementMinT
	| WeatherElementCI
	| WeatherElementMaxT;

export type WeatherElementWx = {
	elementName: 'Wx';
	time: Array<{ startTime: string; endTime: string; parameter: ParameterWx }>;
};

export type ParameterWx = {
	parameterName: string;
	parameterValue: string;
};

export type WeatherElementPop = {
	elementName: 'Pop';
	time: Array<{ startTime: string; endTime: string; parameter: ParameterPop }>;
};

export type ParameterPop = {
	parameterName: string;
	parameterUnit: string;
};

export type WeatherElementMinT = {
	elementName: 'MinT';
	time: Array<{ startTime: string; endTime: string; parameter: ParameterMinT }>;
};

export type ParameterMinT = {
	parameterName: string;
	parameterUnit: string;
};

export type WeatherElementCI = {
	elementName: 'CI';
	time: Array<{ startTime: string; endTime: string; parameter: ParameterCI }>;
};

export type ParameterCI = {
	parameterName: string;
};

export type WeatherElementMaxT = {
	elementName: 'MaxT';
	time: Array<{ startTime: string; endTime: string; parameter: ParameterMaxT }>;
};

export type ParameterMaxT = {
	parameterName: string;
	parameterUnit: string;
};

/* 
example: 
{
  "success": "true",
  "result": {
    "resource_id": "F-C0032-001",
    "fields": [
      {
        "id": "datasetDescription",
        "type": "String"
      },
      {
        "id": "locationName",
        "type": "String"
      },
      {
        "id": "parameterName",
        "type": "String"
      },
      {
        "id": "parameterValue",
        "type": "String"
      },
      {
        "id": "parameterUnit",
        "type": "String"
      },
      {
        "id": "startTime",
        "type": "Timestamp"
      },
      {
        "id": "endTime",
        "type": "Timestamp"
      }
    ]
  },
  "records": {
    "datasetDescription": "三十六小時天氣預報",
    "location": [
      {
        "locationName": "嘉義縣",
        "weatherElement": [
          {
            "elementName": "Wx",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "陰天",
                  "parameterValue": "7"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "多雲",
                  "parameterValue": "4"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "20",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "20",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "20",
                  "parameterUnit": "百分比"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "32",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "26",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "26",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "CI",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "悶熱至易中暑"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "舒適至易中暑"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "35",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "32",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "35",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      },
      {
        "locationName": "新北市",
        "weatherElement": [
          {
            "elementName": "Wx",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "多雲",
                  "parameterValue": "4"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "多雲時晴",
                  "parameterValue": "3"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "0",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "0",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "32",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "28",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "28",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "CI",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "悶熱至易中暑"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "35",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "32",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "36",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      },
      {
        "locationName": "嘉義市",
        "weatherElement": [
          {
            "elementName": "Wx",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "多雲午後短暫雷陣雨",
                  "parameterValue": "22"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "晴午後短暫雷陣雨",
                  "parameterValue": "21"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "60",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "20",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "40",
                  "parameterUnit": "百分比"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "31",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "25",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "25",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "CI",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "悶熱至易中暑"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "舒適至易中暑"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "36",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "31",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "36",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      },
      {
        "locationName": "新竹縣",
        "weatherElement": [
          {
            "elementName": "Wx",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "多雲",
                  "parameterValue": "4"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "32",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "27",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "27",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "CI",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "悶熱至易中暑"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "35",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "32",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "35",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      },
      {
        "locationName": "新竹市",
        "weatherElement": [
          {
            "elementName": "Wx",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "多雲",
                  "parameterValue": "4"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "32",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "27",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "27",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "CI",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "悶熱至易中暑"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "35",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "32",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "34",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      },
      {
        "locationName": "臺北市",
        "weatherElement": [
          {
            "elementName": "Wx",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "多雲",
                  "parameterValue": "4"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "多雲時晴",
                  "parameterValue": "3"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "0",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "33",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "27",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "27",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "CI",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "悶熱至易中暑"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "舒適至易中暑"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "37",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "33",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "37",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      },
      {
        "locationName": "臺南市",
        "weatherElement": [
          {
            "elementName": "Wx",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "多雲午後短暫雷陣雨",
                  "parameterValue": "22"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "晴午後短暫雷陣雨",
                  "parameterValue": "21"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "30",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "20",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "50",
                  "parameterUnit": "百分比"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "31",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "28",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "28",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "CI",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "悶熱至易中暑"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "舒適至易中暑"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "34",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "31",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "35",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      },
      {
        "locationName": "宜蘭縣",
        "weatherElement": [
          {
            "elementName": "Wx",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "多雲時晴",
                  "parameterValue": "3"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "0",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "0",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "0",
                  "parameterUnit": "百分比"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "31",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "27",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "27",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "CI",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "悶熱"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "35",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "31",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "34",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      },
      {
        "locationName": "苗栗縣",
        "weatherElement": [
          {
            "elementName": "Wx",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "陰時多雲",
                  "parameterValue": "6"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "10",
                  "parameterUnit": "百分比"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "31",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "26",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "26",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "CI",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "悶熱"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "34",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "31",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "33",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      },
      {
        "locationName": "雲林縣",
        "weatherElement": [
          {
            "elementName": "Wx",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "陰時多雲",
                  "parameterValue": "6"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "晴時多雲",
                  "parameterValue": "2"
                }
              }
            ]
          },
          {
            "elementName": "PoP",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "20",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "20",
                  "parameterUnit": "百分比"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "20",
                  "parameterUnit": "百分比"
                }
              }
            ]
          },
          {
            "elementName": "MinT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "31",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "26",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "26",
                  "parameterUnit": "C"
                }
              }
            ]
          },
          {
            "elementName": "CI",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "悶熱至易中暑"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "舒適至悶熱"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "舒適至易中暑"
                }
              }
            ]
          },
          {
            "elementName": "MaxT",
            "time": [
              {
                "startTime": "2024-07-20 12:00:00",
                "endTime": "2024-07-20 18:00:00",
                "parameter": {
                  "parameterName": "35",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-20 18:00:00",
                "endTime": "2024-07-21 06:00:00",
                "parameter": {
                  "parameterName": "31",
                  "parameterUnit": "C"
                }
              },
              {
                "startTime": "2024-07-21 06:00:00",
                "endTime": "2024-07-21 18:00:00",
                "parameter": {
                  "parameterName": "35",
                  "parameterUnit": "C"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
*/
