/** 牙規資料層：保存各牙規的外徑、螺距、底孔徑與部分加工深度。 */
window.NCProgram = window.NCProgram || {};

(() => {
    const NC = window.NCProgram;

// 螺紋資料：集中管理各牙規的外徑、螺距、底孔徑與部分建議深度。
// TPI 轉 mm 螺距，PT/NPT 會用到。
const P_tpi = tpi => Number((25.4 / tpi).toFixed(3));

const threadData = {
            //60° Parallel Thread: such as UNC.
            "UNC 1/4-20": { ThreadType: "UNC", MajorDiameter: 6.35, Pitch: 1.27, TapDrillDiameter: 5.1 },
            "UNC 5/16-18": { ThreadType: "UNC", MajorDiameter: 7.938, Pitch: 1.411, TapDrillDiameter: 6.6 },
            "UNC 3/8-16": { ThreadType: "UNC", MajorDiameter: 9.525, Pitch: 1.588, TapDrillDiameter: 8.0 },
            "UNC 7/16-14": { ThreadType: "UNC", MajorDiameter: 11.112, Pitch: 1.814, TapDrillDiameter: 9.3 },
            "UNC 1/2-13": { ThreadType: "UNC", MajorDiameter: 12.7, Pitch: 1.954, TapDrillDiameter: 10.8 },
            "UNC 9/16-12": { ThreadType: "UNC", MajorDiameter: 14.288, Pitch: 2.117, TapDrillDiameter: 12.2 },

            // PT / NPT
            "PT 1/4": { MajorDiameter: 13.157, Pitch: P_tpi(19), TapDrillDiameter: 11.113, DepthOfCut: 9.4 },   // PT 牙
            "PT 3/8": { MajorDiameter: 16.662, Pitch: P_tpi(19), TapDrillDiameter: 14.684, DepthOfCut: 9.7 },
            "PT 1/2": { MajorDiameter: 20.955, Pitch: P_tpi(14), TapDrillDiameter: 18.256, DepthOfCut: 12.7 },
            "PT 5/8": { MajorDiameter: 22.911, Pitch: P_tpi(14), TapDrillDiameter: 20.9, DepthOfCut: 13.4 },
            "PT 3/4": { MajorDiameter: 26.441, Pitch: P_tpi(14), TapDrillDiameter: 23.813, DepthOfCut: 14.1 },
            "PT 7/8": { MajorDiameter: 30.201, Pitch: P_tpi(14), TapDrillDiameter: 28.1, DepthOfCut: 15.2 },

            "NPT 1/4": { MajorDiameter: 13.716, Pitch: P_tpi(18), TapDrillDiameter: 11.113, DepthOfCut: 12 },   // NPT 牙
            "NPT 3/8": { MajorDiameter: 17.145, Pitch: P_tpi(18), TapDrillDiameter: 14.288, DepthOfCut: 12 },
            "NPT 1/2": { MajorDiameter: 21.336, Pitch: P_tpi(14), TapDrillDiameter: 17.859, DepthOfCut: 12 },
            "NPT 3/4": { MajorDiameter: 26.67, Pitch: P_tpi(14), TapDrillDiameter: 23.019, DepthOfCut: 12 },

            // G (BSPP) subset
            "G (PF) 1/16": { MajorDiameter: 7.723, Pitch: 0.907, TapDrillDiameter: 6.8 },
            "G (PF) 1/8": { MajorDiameter: 9.728, Pitch: 0.907, TapDrillDiameter: 8.7 },
            "G (PF) 1/4": { MajorDiameter: 13.157, Pitch: 1.337, TapDrillDiameter: 11.7 },
            "G (PF) 3/8": { MajorDiameter: 16.662, Pitch: 1.337, TapDrillDiameter: 15.2 },
            "G (PF) 1/2": { MajorDiameter: 20.955, Pitch: 1.814, TapDrillDiameter: 18.9 },
            "G (PF) 5/8": { MajorDiameter: 22.911, Pitch: 1.814, TapDrillDiameter: 20.9 },
            "G (PF) 3/4": { MajorDiameter: 26.441, Pitch: 1.814, TapDrillDiameter: 24.4 },
            "G (PF) 7/8": { MajorDiameter: 30.201, Pitch: 1.814, TapDrillDiameter: 28.1 },

            // Metric Coarse（粗牙）
            "M 6 x 1.0": { ThreadType: "Coarse", MajorDiameter: 6, Pitch: 1.0, TapDrillDiameter: 5 },
            "M 7 x 1.0": { ThreadType: "Coarse", MajorDiameter: 7, Pitch: 1.0, TapDrillDiameter: 6 },
            "M 8 x 1.25": { ThreadType: "Coarse", MajorDiameter: 8, Pitch: 1.25, TapDrillDiameter: 6.8 },
            "M 9 x 1.25": { ThreadType: "Coarse", MajorDiameter: 9, Pitch: 1.25, TapDrillDiameter: 7.8 },
            "M 10 x 1.5": { ThreadType: "Coarse", MajorDiameter: 10, Pitch: 1.5, TapDrillDiameter: 8.5 },
            "M 11 x 1.5": { ThreadType: "Coarse", MajorDiameter: 11, Pitch: 1.5, TapDrillDiameter: 9.5 },
            "M 12 x 1.75": { ThreadType: "Coarse", MajorDiameter: 12, Pitch: 1.75, TapDrillDiameter: 10.3 },
            "M 14 x 2.0": { ThreadType: "Coarse", MajorDiameter: 14, Pitch: 2.0, TapDrillDiameter: 12 },
            "M 16 x 2.0": { ThreadType: "Coarse", MajorDiameter: 16, Pitch: 2.0, TapDrillDiameter: 14 },

            // Metric Fine（細牙；你的資料維持用 MF 前綴）
            "MF 6 x 0.75": { ThreadType: "Fine", MajorDiameter: 6, Pitch: 0.75, TapDrillDiameter: 5.3 },
            "MF 7 x 0.75": { ThreadType: "Fine", MajorDiameter: 7, Pitch: 0.75, TapDrillDiameter: 6.3 },
            "MF 8 x 0.75": { ThreadType: "Fine", MajorDiameter: 8, Pitch: 0.75, TapDrillDiameter: 7.3 },
            "MF 8 x 1.0": { ThreadType: "Fine", MajorDiameter: 8, Pitch: 1.0, TapDrillDiameter: 7 },
            "MF 9 x 0.75": { ThreadType: "Fine", MajorDiameter: 9, Pitch: 0.75, TapDrillDiameter: 8.3 },
            "MF 9 x 1.0": { ThreadType: "Fine", MajorDiameter: 9, Pitch: 1.0, TapDrillDiameter: 8 },
            "MF 10 x 0.75": { ThreadType: "Fine", MajorDiameter: 10, Pitch: 0.75, TapDrillDiameter: 9.3 },
            "MF 10 x 1.0": { ThreadType: "Fine", MajorDiameter: 10, Pitch: 1.0, TapDrillDiameter: 9 },
            "MF 10 x 1.25": { ThreadType: "Fine", MajorDiameter: 10, Pitch: 1.25, TapDrillDiameter: 8.8 },
            "MF 11 x 0.75": { ThreadType: "Fine", MajorDiameter: 11, Pitch: 0.75, TapDrillDiameter: 10.3 },
            "MF 11 x 1.0": { ThreadType: "Fine", MajorDiameter: 11, Pitch: 1.0, TapDrillDiameter: 10 },
            "MF 12 x 1.0": { ThreadType: "Fine", MajorDiameter: 12, Pitch: 1.0, TapDrillDiameter: 11 },
            "MF 12 x 1.25": { ThreadType: "Fine", MajorDiameter: 12, Pitch: 1.25, TapDrillDiameter: 10.8 },
            "MF 12 x 1.5": { ThreadType: "Fine", MajorDiameter: 12, Pitch: 1.5, TapDrillDiameter: 10.5 },
            "MF 14 x 1.0": { ThreadType: "Fine", MajorDiameter: 14, Pitch: 1.0, TapDrillDiameter: 13 },
            "MF 14 x 1.25": { ThreadType: "Fine", MajorDiameter: 14, Pitch: 1.25, TapDrillDiameter: 12.8 },
            "MF 14 x 1.5": { ThreadType: "Fine", MajorDiameter: 14, Pitch: 1.5, TapDrillDiameter: 12.5 },
            "MF 15 x 1.0": { ThreadType: "Fine", MajorDiameter: 15, Pitch: 1.0, TapDrillDiameter: 14 },
            "MF 15 x 1.5": { ThreadType: "Fine", MajorDiameter: 15, Pitch: 1.5, TapDrillDiameter: 13.5 },
            "MF 16 x 1.0": { ThreadType: "Fine", MajorDiameter: 16, Pitch: 1.0, TapDrillDiameter: 15 },
            "MF 16 x 1.5": { ThreadType: "Fine", MajorDiameter: 16, Pitch: 1.5, TapDrillDiameter: 14.5 },
            "MF 17 x 1.0": { ThreadType: "Fine", MajorDiameter: 17, Pitch: 1.0, TapDrillDiameter: 16 },
            "MF 17 x 1.5": { ThreadType: "Fine", MajorDiameter: 17, Pitch: 1.5, TapDrillDiameter: 15.5 },
            "MF 18 x 1.0": { ThreadType: "Fine", MajorDiameter: 18, Pitch: 1.0, TapDrillDiameter: 17 },
            "MF 18 x 1.5": { ThreadType: "Fine", MajorDiameter: 18, Pitch: 1.5, TapDrillDiameter: 16.5 },
            "MF 18 x 2.0": { ThreadType: "Fine", MajorDiameter: 18, Pitch: 2.0, TapDrillDiameter: 16 },
            "MF 20 x 1.0": { ThreadType: "Fine", MajorDiameter: 20, Pitch: 1.0, TapDrillDiameter: 19 },
            "MF 20 x 1.5": { ThreadType: "Fine", MajorDiameter: 20, Pitch: 1.5, TapDrillDiameter: 18.5 },
            "MF 20 x 2.0": { ThreadType: "Fine", MajorDiameter: 20, Pitch: 2.0, TapDrillDiameter: 18 },
            "MF 22 x 1.0": { ThreadType: "Fine", MajorDiameter: 22, Pitch: 1.0, TapDrillDiameter: 21 },
            "MF 22 x 1.5": { ThreadType: "Fine", MajorDiameter: 22, Pitch: 1.5, TapDrillDiameter: 20.5 },
            "MF 22 x 2.0": { ThreadType: "Fine", MajorDiameter: 22, Pitch: 2.0, TapDrillDiameter: 20 },
            "MF 24 x 1.0": { ThreadType: "Fine", MajorDiameter: 24, Pitch: 1.0, TapDrillDiameter: 23 },
            "MF 24 x 1.5": { ThreadType: "Fine", MajorDiameter: 24, Pitch: 1.5, TapDrillDiameter: 22.5 },
            "MF 24 x 2.0": { ThreadType: "Fine", MajorDiameter: 24, Pitch: 2.0, TapDrillDiameter: 22 },
            "MF 25 x 1.0": { ThreadType: "Fine", MajorDiameter: 25, Pitch: 1.0, TapDrillDiameter: 24 },
            "MF 25 x 1.5": { ThreadType: "Fine", MajorDiameter: 25, Pitch: 1.5, TapDrillDiameter: 23.5 },
            "MF 25 x 2.0": { ThreadType: "Fine", MajorDiameter: 25, Pitch: 2.0, TapDrillDiameter: 23 },
            "MF 27 x 1.0": { ThreadType: "Fine", MajorDiameter: 27, Pitch: 1.0, TapDrillDiameter: 26 },
            "MF 27 x 1.5": { ThreadType: "Fine", MajorDiameter: 27, Pitch: 1.5, TapDrillDiameter: 25.5 },
            "MF 27 x 2.0": { ThreadType: "Fine", MajorDiameter: 27, Pitch: 2.0, TapDrillDiameter: 25 },
            "MF 28 x 1.0": { ThreadType: "Fine", MajorDiameter: 28, Pitch: 1.0, TapDrillDiameter: 27 },
            "MF 28 x 1.5": { ThreadType: "Fine", MajorDiameter: 28, Pitch: 1.5, TapDrillDiameter: 26.5 },
            "MF 28 x 2.0": { ThreadType: "Fine", MajorDiameter: 28, Pitch: 2.0, TapDrillDiameter: 26 },
            "MF 30 x 1.0": { ThreadType: "Fine", MajorDiameter: 30, Pitch: 1.0, TapDrillDiameter: 29 },
            "MF 30 x 1.5": { ThreadType: "Fine", MajorDiameter: 30, Pitch: 1.5, TapDrillDiameter: 28.5 },
            "MF 30 x 2.0": { ThreadType: "Fine", MajorDiameter: 30, Pitch: 2.0, TapDrillDiameter: 28 },
            "MF 32 x 1.5": { ThreadType: "Fine", MajorDiameter: 32, Pitch: 1.5, TapDrillDiameter: 30.5 },
            "MF 32 x 2.0": { ThreadType: "Fine", MajorDiameter: 32, Pitch: 2.0, TapDrillDiameter: 30 },
            "MF 33 x 1.0": { ThreadType: "Fine", MajorDiameter: 33, Pitch: 1.0, TapDrillDiameter: 31.5 },
            "MF 33 x 1.5": { ThreadType: "Fine", MajorDiameter: 33, Pitch: 1.5, TapDrillDiameter: 31.5 },
            "MF 33 x 2.0": { ThreadType: "Fine", MajorDiameter: 33, Pitch: 2.0, TapDrillDiameter: 31 },
            "MF 35 x 1.5": { ThreadType: "Fine", MajorDiameter: 35, Pitch: 1.5, TapDrillDiameter: 33.5 },
            "MF 36 x 1.5": { ThreadType: "Fine", MajorDiameter: 36, Pitch: 1.5, TapDrillDiameter: 34.5 },
            "MF 36 x 2.0": { ThreadType: "Fine", MajorDiameter: 36, Pitch: 2.0, TapDrillDiameter: 34 },
            "MF 39 x 1.5": { ThreadType: "Fine", MajorDiameter: 39, Pitch: 1.5, TapDrillDiameter: 37.5 },
            "MF 39 x 2.0": { ThreadType: "Fine", MajorDiameter: 39, Pitch: 2.0, TapDrillDiameter: 37 },
            "MF 40 x 1.5": { ThreadType: "Fine", MajorDiameter: 40, Pitch: 1.5, TapDrillDiameter: 38.5 },
            "MF 40 x 2.0": { ThreadType: "Fine", MajorDiameter: 40, Pitch: 2.0, TapDrillDiameter: 38 },
            "MF 42 x 1.5": { ThreadType: "Fine", MajorDiameter: 42, Pitch: 1.5, TapDrillDiameter: 40.5 },
            "MF 42 x 2.0": { ThreadType: "Fine", MajorDiameter: 42, Pitch: 2.0, TapDrillDiameter: 40 },
            "MF 45 x 1.5": { ThreadType: "Fine", MajorDiameter: 45, Pitch: 1.5, TapDrillDiameter: 43.5 },
            "MF 45 x 2.0": { ThreadType: "Fine", MajorDiameter: 45, Pitch: 2.0, TapDrillDiameter: 43 },
            "MF 48 x 1.5": { ThreadType: "Fine", MajorDiameter: 48, Pitch: 1.5, TapDrillDiameter: 46.5 },
            "MF 48 x 2.0": { ThreadType: "Fine", MajorDiameter: 48, Pitch: 2.0, TapDrillDiameter: 46 },
            "MF 50 x 1.5": { ThreadType: "Fine", MajorDiameter: 50, Pitch: 1.5, TapDrillDiameter: 48.5 },
            "MF 50 x 2.0": { ThreadType: "Fine", MajorDiameter: 50, Pitch: 2.0, TapDrillDiameter: 48 },
            "MF 52 x 2.0": { ThreadType: "Fine", MajorDiameter: 52, Pitch: 2.0, TapDrillDiameter: 50 },
            "MF 55 x 2.0": { ThreadType: "Fine", MajorDiameter: 55, Pitch: 2.0, TapDrillDiameter: 53 },
            "MF 56 x 2.0": { ThreadType: "Fine", MajorDiameter: 56, Pitch: 2.0, TapDrillDiameter: 54 },
            "MF 58 x 2.0": { ThreadType: "Fine", MajorDiameter: 58, Pitch: 2.0, TapDrillDiameter: 56 },
            "MF 60 x 2.0": { ThreadType: "Fine", MajorDiameter: 60, Pitch: 2.0, TapDrillDiameter: 58 },
            "MF 62 x 2.0": { ThreadType: "Fine", MajorDiameter: 62, Pitch: 2.0, TapDrillDiameter: 60 },
            "MF 64 x 2.0": { ThreadType: "Fine", MajorDiameter: 64, Pitch: 2.0, TapDrillDiameter: 62 },
            "MF 65 x 2.0": { ThreadType: "Fine", MajorDiameter: 65, Pitch: 2.0, TapDrillDiameter: 63 },
            "MF 68 x 2.0": { ThreadType: "Fine", MajorDiameter: 68, Pitch: 2.0, TapDrillDiameter: 66 },
            "MF 70 x 2.0": { ThreadType: "Fine", MajorDiameter: 70, Pitch: 2.0, TapDrillDiameter: 68 },
            "MF 72 x 2.0": { ThreadType: "Fine", MajorDiameter: 72, Pitch: 2.0, TapDrillDiameter: 70 },
            "MF 75 x 2.0": { ThreadType: "Fine", MajorDiameter: 75, Pitch: 2.0, TapDrillDiameter: 73 },
            "MF 76 x 2.0": { ThreadType: "Fine", MajorDiameter: 76, Pitch: 2.0, TapDrillDiameter: 74 },
            "MF 80 x 2.0": { ThreadType: "Fine", MajorDiameter: 80, Pitch: 2.0, TapDrillDiameter: 78 },

            // UNC/UNF/UNEF


            "UNF 1/4-28": { ThreadType: "UNF", MajorDiameter: 6.35, Pitch: 0.907, TapDrillDiameter: 5.5 },
            "UNF 5/16-24": { ThreadType: "UNF", MajorDiameter: 7.938, Pitch: 1.058, TapDrillDiameter: 6.9 },
            "UNF 3/8-24": { ThreadType: "UNF", MajorDiameter: 9.525, Pitch: 1.058, TapDrillDiameter: 8.5 },
            "UNF 7/16-20": { ThreadType: "UNF", MajorDiameter: 11.112, Pitch: 1.27, TapDrillDiameter: 9.9 },
            "UNF 1/2-20": { ThreadType: "UNF", MajorDiameter: 12.7, Pitch: 1.27, TapDrillDiameter: 11.5 },
            "UNF 9/16-18": { ThreadType: "UNF", MajorDiameter: 14.288, Pitch: 1.411, TapDrillDiameter: 12.9 },
            "UNF 5/8-18": { ThreadType: "UNF", MajorDiameter: 15.875, Pitch: 1.411, TapDrillDiameter: 14.5 },
            "UNF 3/4-16": { ThreadType: "UNF", MajorDiameter: 19.05, Pitch: 1.588, TapDrillDiameter: 17.5 },
            "UNF 7/8-14": { ThreadType: "UNF", MajorDiameter: 22.225, Pitch: 1.814, TapDrillDiameter: 20.5 },

            "UNEF 1/4-32": { ThreadType: "UNEF", MajorDiameter: 6.35, Pitch: 0.794, TapDrillDiameter: 5.6 },
            "UNEF 5/16-32": { ThreadType: "UNEF", MajorDiameter: 7.938, Pitch: 0.794, TapDrillDiameter: 7.2 },
            "UNEF 3/8-32": { ThreadType: "UNEF", MajorDiameter: 9.525, Pitch: 0.794, TapDrillDiameter: 8.8 },
            "UNEF 7/16-28": { ThreadType: "UNEF", MajorDiameter: 11.112, Pitch: 0.907, TapDrillDiameter: 10.2 },
            "UNEF 1/2-28": { ThreadType: "UNEF", MajorDiameter: 12.7, Pitch: 0.907, TapDrillDiameter: 11.8 },
            "UNEF 9/16-24": { ThreadType: "UNEF", MajorDiameter: 14.288, Pitch: 1.058, TapDrillDiameter: 13.3 },
            "UNEF 5/8-24": { ThreadType: "UNEF", MajorDiameter: 15.875, Pitch: 1.058, TapDrillDiameter: 14.9 },
            "UNEF 11/16-24": { ThreadType: "UNEF", MajorDiameter: 17.462, Pitch: 1.058, TapDrillDiameter: 16.4 },
            "UNEF 3/4-20": { ThreadType: "UNEF", MajorDiameter: 19.05, Pitch: 1.27, TapDrillDiameter: 17.8 },
            "UNEF 13/16-20": { ThreadType: "UNEF", MajorDiameter: 20.638, Pitch: 1.27, TapDrillDiameter: 19.4 },
            "UNEF 7/8-20": { ThreadType: "UNEF", MajorDiameter: 22.225, Pitch: 1.27, TapDrillDiameter: 21 },
            "UNEF 15/16-20": { ThreadType: "UNEF", MajorDiameter: 23.812, Pitch: 1.27, TapDrillDiameter: 22.6 },
            "UNEF 1-20": { ThreadType: "UNEF", MajorDiameter: 25.4, Pitch: 1.27, TapDrillDiameter: 24.2 },
            "UNEF 1 1/16-18": { ThreadType: "UNEF", MajorDiameter: 26.988, Pitch: 1.411, TapDrillDiameter: 25.6 },
            "UNEF 1 1/8-18": { ThreadType: "UNEF", MajorDiameter: 28.575, Pitch: 1.411, TapDrillDiameter: 27.2 },
            "UNEF 1 3/16-18": { ThreadType: "UNEF", MajorDiameter: 30.162, Pitch: 1.411, TapDrillDiameter: 28.8 },
            "UNEF 1 1/4-18": { ThreadType: "UNEF", MajorDiameter: 31.75, Pitch: 1.411, TapDrillDiameter: 30.4 },
            "UNEF 1 5/16-18": { ThreadType: "UNEF", MajorDiameter: 33.338, Pitch: 1.411, TapDrillDiameter: 32 },
            "UNEF 1 3/8-18": { ThreadType: "UNEF", MajorDiameter: 34.925, Pitch: 1.411, TapDrillDiameter: 33.6 },
            "UNEF 1 7/16-18": { ThreadType: "UNEF", MajorDiameter: 36.512, Pitch: 1.411, TapDrillDiameter: 35.1 },
            "UNEF 1 1/2-18": { ThreadType: "UNEF", MajorDiameter: 38.1, Pitch: 1.411, TapDrillDiameter: 36.7 },
            "UNEF 1 9/16-18": { ThreadType: "UNEF", MajorDiameter: 39.688, Pitch: 1.411, TapDrillDiameter: 38.3 },
            "UNEF 1 5/8-18": { ThreadType: "UNEF", MajorDiameter: 41.275, Pitch: 1.411, TapDrillDiameter: 39.9 },
            "UNEF 1 11/16-18": { ThreadType: "UNEF", MajorDiameter: 42.862, Pitch: 1.411, TapDrillDiameter: 41.5 },

            // ----- Heli-Coil Overrides（修正你原本的 HC-M* → HC M*；刪除重複鍵）-----
            "HC M5 x 0.8": { ThreadType: "HC", MajorDiameter: 6.04, Pitch: 0.8, TapDrillDiameter: 5.3 },  // HC 專用外徑/導孔
            "HC M6 x 1.0": { ThreadType: "HC", MajorDiameter: 7.3, Pitch: 1.0, TapDrillDiameter: 6.3 },
            "HC M7 x 1.0": { ThreadType: "HC", MajorDiameter: 8.3, Pitch: 1.0, TapDrillDiameter: 7.3 },
            "HC M8 x 1.0": { ThreadType: "HC", MajorDiameter: 9.3, Pitch: 1.0, TapDrillDiameter: 8.3 },
            "HC M8 x 1.25": { ThreadType: "HC", MajorDiameter: 9.624, Pitch: 1.25, TapDrillDiameter: 8.4 },
            "HC M9 x 1.0": { ThreadType: "HC", MajorDiameter: 10.3, Pitch: 1.0, TapDrillDiameter: 9.3 },
            "HC M9 x 1.25": { ThreadType: "HC", MajorDiameter: 10.624, Pitch: 1.25, TapDrillDiameter: 9.4 },
            "HC M10 x 1.0": { ThreadType: "HC", MajorDiameter: 11.3, Pitch: 1.0, TapDrillDiameter: 10.3 },
            "HC M10 x 1.25": { ThreadType: "HC", MajorDiameter: 11.624, Pitch: 1.25, TapDrillDiameter: 10.4 },
            "HC M10 x 1.5": { ThreadType: "HC", MajorDiameter: 11.948, Pitch: 1.5, TapDrillDiameter: 10.4 },
            "HC M11 x 1.0": { ThreadType: "HC", MajorDiameter: 12.3, Pitch: 1.0, TapDrillDiameter: 11.3 },
            "HC M11 x 1.5": { ThreadType: "HC", MajorDiameter: 12.948, Pitch: 1.5, TapDrillDiameter: 11.4 },
            "HC M12 x 1.0": { ThreadType: "HC", MajorDiameter: 13.3, Pitch: 1.0, TapDrillDiameter: 12.3 }
        };

const coarsePitch = { 6: 1.0, 7: 1.0, 8: 1.25, 9: 1.25, 10: 1.5, 11: 1.5, 12: 1.75, 14: 2.0, 15: 2.0, 16: 2.0, 17: 2.0, 18: 2.5, 20: 2.5, 22: 2.5, 24: 3.0 };


    // 螺紋資料集中提供給篩選、depth 與 G-code 計算。
    NC.P_tpi = P_tpi;
    NC.threadData = threadData;
    NC.coarsePitch = coarsePitch;
})();
