import requests

try:
    response = requests.get('http://localhost:8000')
    if response.status_code == 200:
        print("服务器正在运行，可以访问！")
        print("您现在可以通过浏览器访问 http://localhost:8000 来玩围棋游戏")
    else:
        print(f"服务器返回状态码: {response.status_code}")
except requests.ConnectionError:
    print("无法连接到服务器，请检查服务器是否已启动")
except Exception as e:
    print(f"发生错误: {e}")