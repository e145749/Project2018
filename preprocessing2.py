import pandas as pd
import numpy as np
import seaborn as sns

#  時刻合わせ
def set_time(data,set_uuid):
    """
    時刻合わせを行う
    第一引数はdataframe
    第２引数は時刻合わせを行うUUID
    """

    #　オブジェクト型の目的変数を数値情報に変換
    import sklearn.preprocessing as sp

    # 前処理用のインスタンスを宣言
    le = sp.LabelEncoder()
    # 時刻合わせ用のビーコンを1秒間隔に設定
    set_time_df = data[data.UUIDs == set_uuid].drop_duplicates(['Minor'],keep = "first")
    # 時刻合わせ用ビーコン以外を定義
    df = data[data.UUIDs != set_uuid]
    # データを結合してインデックスでソート
    df = df.append(set_time_df).sort_index(ascending=True)
    # 時刻合わせ用ビーコンを取得した行にtimeカラムを設定
    df["time"] = df["Minor"].where(df["UUIDs"] == set_uuid)
    # 時刻合わせを行い欠損値がある部分は削除
    df = df.fillna(method="ffill").dropna()
    # int型に変換
    df["time"] = df["time"].astype(int)
    # 時刻合わせ用のビーコンデータ以外
    df = df[df["UUIDs"] != set_uuid]
    
    return df


#直接波と減衰波の識別
def make_cluster(df_list,colum,*,N_CLUSTERS=2):
    """
          反射波と入射波を判別するクラスタを作成し描写を行う
          第1引数(地点毎のデータフレームが入ったリスト)
          第２引数(クラスタリングを行いたいカラムのリスト)
          第３引数(クラスタ数)
          データフレーム型でクラスタリング結果を返す
    """

    # KMeansライブラリをインポート
    from sklearn.cluster import KMeans
    # 空のデータフレームを用意
    df_cluster = pd.DataFrame()
    concat_list = []
    #ビーコンごとに
    for df in df_list: 
        #受信機のエリアごとに
        for dev in df.device_area.unique():
            #受信機ごとに分けたdataframe
            df_dev = df[df.device_area == dev].copy()
            # 指定されたカラムを利用してクラスタリング
            pred = KMeans(n_clusters=N_CLUSTERS).fit_predict(np.array(df_dev[colum]))
            # clusterカラムを作成し予測結果を代入
            df_dev.loc[:,("cluster")] = pred
            # RSSI値の平均値を比較して入射波と反射波の判定を行う
            if df_dev[df_dev["cluster"] == 0]["RSSI"].mean() > df_dev[df_dev["cluster"] == 1]["RSSI"].mean():
                pass
            else:
                df_dev.loc[df_dev["cluster"] == 0,"cluster"] = 3
                df_dev.loc[df_dev["cluster"] == 1,"cluster"] = 0
                df_dev.loc[df_dev["cluster"] == 3,"cluster"] = 1
            # 予測結果を格納
            df_cluster = pd.concat([df_cluster,df_dev],ignore_index=True)
        concat_list.append(df_cluster)
        # 空のデータフレームを用意
        df_cluster = pd.DataFrame()

    return concat_list


#時刻毎に平均値を取り、新しくデータフレームを作る
def max_value(df_list):
    # timeのmax値を計算
    for df in df_list:
        max_value = 0
        if max_value < df["time"].max():
            max_value = df["time"].max()
    return max_value

#forの部分の引数に変更
#座標として、引数にx,yを追加
def get_mean(df,colum_name,locate,x,y,time_max):    
    """
    処理時間かかります。
    時刻毎の中央値をとる
    第一引数、データフレーム
    第２引数、作成したいカラム名
    """
    # 空のデータフレームとリストを用意
    Direct_list = []
    Reflect_list = []
    mid_df = pd.DataFrame()
    
    # timeのユニーク数だけ
    for time_num in range(time_max): 
        # 受信機の数だけ
        for i in df["device"].unique(): 
            # timeラベルが同じ値に対して平均値をとる
            Direct = df[(df["time"] == time_num) & (df["device"] == i) & (df["cluster"] == 0)]["RSSI"].mean()
            Reflect = df[(df["time"] == time_num) & (df["device"] == i) & (df["cluster"] == 1)]["RSSI"].mean()
            # 平均値をリストに追加する
            Direct_list.append(Direct)
            Reflect_list.append(Reflect)
        # 平均値を追加したリストに(時間、地点、クラスタ番号を追加)
        Direct_list.extend([time_num,locate,x,y,0])
        Reflect_list.extend([time_num,locate,x,y,1])
        # データフレームに各要素を追加
        mid_df = mid_df.append(pd.Series(Direct_list),ignore_index=True)
        mid_df = mid_df.append(pd.Series(Reflect_list),ignore_index=True)
        # 平均値のリストを初期化
        Direct_list = []
        Reflect_list = []
    # カラム名を定義
    mid_df.columns = [colum_name]
    
    return mid_df
